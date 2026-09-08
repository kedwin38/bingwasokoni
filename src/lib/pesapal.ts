import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/crypto";
import { normalizeMsisdn, isValidKenyanMsisdn } from "@/lib/mpesa";

export type ResolvedPesapalConfig = {
  environment: "sandbox" | "production";
  consumerKey: string;
  consumerSecret: string;
  ipnId: string | null;
  ipnUrl: string | null;
  callbackBaseUrl: string | null;
  isConfigured: boolean;
};

function baseUrl(environment: string) {
  return environment === "production"
    ? "https://pay.pesapal.com/v3"
    : "https://cybqa.pesapal.com/pesapalv3";
}

export class PesapalError extends Error {
  constructor(
    message: string,
    public status?: number,
    public details?: unknown,
  ) {
    super(message);
    this.name = "PesapalError";
  }
}

export async function getPesapalConfig(): Promise<ResolvedPesapalConfig> {
  const row = await prisma.pesapalConfig.findUnique({ where: { id: "default" } });
  if (!row) {
    return {
      environment: "sandbox",
      consumerKey: "",
      consumerSecret: "",
      ipnId: null,
      ipnUrl: null,
      callbackBaseUrl: null,
      isConfigured: false,
    };
  }
  return {
    environment: row.environment as "sandbox" | "production",
    consumerKey: decryptSecret(row.consumerKeyEnc),
    consumerSecret: decryptSecret(row.consumerSecretEnc),
    ipnId: row.ipnId,
    ipnUrl: row.ipnUrl,
    callbackBaseUrl: row.callbackBaseUrl,
    isConfigured: row.isConfigured,
  };
}

async function getAccessToken(config: ResolvedPesapalConfig): Promise<string> {
  if (!config.consumerKey || !config.consumerSecret) {
    throw new PesapalError("Pesapal API credentials are not configured. Ask an admin to set them up.");
  }
  const res = await fetch(`${baseUrl(config.environment)}/api/Auth/RequestToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ consumer_key: config.consumerKey, consumer_secret: config.consumerSecret }),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error || !data.token) {
    throw new PesapalError(
      data.error?.message || "Failed to authenticate with Pesapal. Check API credentials.",
      res.status,
      data,
    );
  }
  return data.token as string;
}

export async function registerPesapalIpn(callbackBaseUrl: string): Promise<{ ipnId: string; ipnUrl: string }> {
  const config = await getPesapalConfig();
  const token = await getAccessToken(config);
  const ipnUrl = `${callbackBaseUrl.replace(/\/$/, "")}/api/pesapal/callback`;

  const res = await fetch(`${baseUrl(config.environment)}/api/URLSetup/RegisterIPN`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ url: ipnUrl, ipn_notification_type: "GET" }),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error || !data.ipn_id) {
    throw new PesapalError(
      data.error?.message || "Failed to register the Pesapal IPN callback URL.",
      res.status,
      data,
    );
  }
  return { ipnId: data.ipn_id as string, ipnUrl };
}

export type PesapalOrderResult = {
  orderTrackingId: string;
  redirectUrl: string;
};

export async function submitPesapalOrder(params: {
  transactionId: string;
  amount: number;
  phone: string;
  description: string;
}): Promise<PesapalOrderResult> {
  const config = await getPesapalConfig();
  if (!config.isConfigured) {
    throw new PesapalError("Payments are not yet configured. Please contact support.");
  }
  if (!isValidKenyanMsisdn(params.phone)) {
    throw new PesapalError("Enter a valid Safaricom number, e.g. 07XXXXXXXX.");
  }
  if (!config.callbackBaseUrl) {
    throw new PesapalError("Payment callback URL is not configured. Ask an admin to set it up.");
  }
  if (!config.ipnId) {
    throw new PesapalError("Pesapal IPN callback is not registered yet. Ask an admin to finish setup.");
  }

  const token = await getAccessToken(config);
  const msisdn = normalizeMsisdn(params.phone);
  const host = new URL(config.callbackBaseUrl).hostname;

  const res = await fetch(`${baseUrl(config.environment)}/api/Transactions/SubmitOrderRequest`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      id: params.transactionId,
      currency: "KES",
      amount: Math.round(params.amount),
      description: params.description.slice(0, 100),
      callback_url: `${config.callbackBaseUrl.replace(/\/$/, "")}/payment-return`,
      notification_id: config.ipnId,
      billing_address: {
        email_address: `customer-${msisdn}@${host}`,
        phone_number: msisdn,
        country_code: "KE",
        first_name: "Customer",
        last_name: msisdn,
      },
    }),
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error || !data.order_tracking_id) {
    throw new PesapalError(
      data.error?.message || "Failed to initiate Pesapal payment. Please try again.",
      res.status,
      data,
    );
  }

  return { orderTrackingId: data.order_tracking_id as string, redirectUrl: data.redirect_url as string };
}

export type PesapalStatusResult = {
  statusCode: number; // 0 = INVALID/PENDING, 1 = COMPLETED, 2 = FAILED, 3 = REVERSED
  description: string;
  confirmationCode?: string;
};

export async function getPesapalTransactionStatus(orderTrackingId: string): Promise<PesapalStatusResult> {
  const config = await getPesapalConfig();
  const token = await getAccessToken(config);

  const res = await fetch(
    `${baseUrl(config.environment)}/api/Transactions/GetTransactionStatus?orderTrackingId=${encodeURIComponent(orderTrackingId)}`,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
    },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    throw new PesapalError(
      data.error?.message || "Failed to check Pesapal transaction status.",
      res.status,
      data,
    );
  }

  return {
    statusCode: Number(data.status_code ?? 0),
    description: data.payment_status_description || data.description || "Unknown",
    confirmationCode: data.confirmation_code || undefined,
  };
}
