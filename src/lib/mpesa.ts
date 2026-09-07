import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/crypto";

export type ResolvedMpesaConfig = {
  environment: "sandbox" | "production";
  shortCode: string;
  tillType: "paybill" | "till";
  consumerKey: string;
  consumerSecret: string;
  passkey: string;
  accountReference: string;
  transactionDesc: string;
  callbackBaseUrl: string | null;
  isConfigured: boolean;
};

function baseUrl(environment: string) {
  return environment === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";
}

export async function getMpesaConfig(): Promise<ResolvedMpesaConfig> {
  const row = await prisma.mpesaConfig.findUnique({ where: { id: "default" } });
  if (!row) {
    return {
      environment: "sandbox",
      shortCode: "174379",
      tillType: "paybill",
      consumerKey: "",
      consumerSecret: "",
      passkey: "",
      accountReference: "BernaGee",
      transactionDesc: "Data Bundle Purchase",
      callbackBaseUrl: null,
      isConfigured: false,
    };
  }
  return {
    environment: row.environment as "sandbox" | "production",
    shortCode: row.shortCode,
    tillType: row.tillType as "paybill" | "till",
    consumerKey: decryptSecret(row.consumerKeyEnc),
    consumerSecret: decryptSecret(row.consumerSecretEnc),
    passkey: decryptSecret(row.passkeyEnc),
    accountReference: row.accountReference,
    transactionDesc: row.transactionDesc,
    callbackBaseUrl: row.callbackBaseUrl,
    isConfigured: row.isConfigured,
  };
}

function timestampNow(): string {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return (
    d.getFullYear().toString() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds())
  );
}

export function normalizeMsisdn(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("254") && digits.length === 12) return digits;
  if (digits.startsWith("0") && digits.length === 10) return `254${digits.slice(1)}`;
  if (digits.startsWith("7") && digits.length === 9) return `254${digits}`;
  if (digits.startsWith("1") && digits.length === 9) return `254${digits}`;
  return digits;
}

export function isValidKenyanMsisdn(phone: string): boolean {
  const normalized = normalizeMsisdn(phone);
  return /^254(7|1)\d{8}$/.test(normalized);
}

export class MpesaError extends Error {
  constructor(
    message: string,
    public status?: number,
    public details?: unknown,
  ) {
    super(message);
    this.name = "MpesaError";
  }
}

async function getAccessToken(config: ResolvedMpesaConfig): Promise<string> {
  if (!config.consumerKey || !config.consumerSecret) {
    throw new MpesaError("M-Pesa API credentials are not configured. Ask an admin to set them up.");
  }
  const credentials = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString("base64");
  const res = await fetch(`${baseUrl(config.environment)}/oauth/v1/generate?grant_type=client_credentials`, {
    method: "GET",
    headers: { Authorization: `Basic ${credentials}` },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new MpesaError("Failed to authenticate with M-Pesa (Daraja). Check API credentials.", res.status, body);
  }
  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) throw new MpesaError("M-Pesa did not return an access token.");
  return data.access_token;
}

export type StkPushResult = {
  merchantRequestId: string;
  checkoutRequestId: string;
  responseCode: string;
  responseDescription: string;
  customerMessage: string;
};

export async function initiateStkPush(params: {
  phone: string;
  amount: number;
  accountReference?: string;
  transactionDesc?: string;
}): Promise<StkPushResult> {
  const config = await getMpesaConfig();
  if (!config.isConfigured) {
    throw new MpesaError("Payments are not yet configured. Please contact support.");
  }
  const msisdn = normalizeMsisdn(params.phone);
  if (!isValidKenyanMsisdn(params.phone)) {
    throw new MpesaError("Enter a valid Safaricom number, e.g. 07XXXXXXXX.");
  }
  if (!config.callbackBaseUrl) {
    throw new MpesaError("Payment callback URL is not configured. Ask an admin to set it up.");
  }

  const token = await getAccessToken(config);
  const timestamp = timestampNow();
  const password = Buffer.from(`${config.shortCode}${config.passkey}${timestamp}`).toString("base64");
  const transactionType =
    config.tillType === "till" ? "CustomerBuyGoodsOnline" : "CustomerPayBillOnline";

  const payload = {
    BusinessShortCode: config.shortCode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: transactionType,
    Amount: Math.round(params.amount),
    PartyA: msisdn,
    PartyB: config.shortCode,
    PhoneNumber: msisdn,
    CallBackURL: `${config.callbackBaseUrl.replace(/\/$/, "")}/api/mpesa/callback`,
    AccountReference: params.accountReference ?? config.accountReference,
    TransactionDesc: params.transactionDesc ?? config.transactionDesc,
  };

  const res = await fetch(`${baseUrl(config.environment)}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || data.errorCode) {
    throw new MpesaError(
      data.errorMessage || "Failed to initiate payment. Please try again.",
      res.status,
      data,
    );
  }

  return {
    merchantRequestId: data.MerchantRequestID,
    checkoutRequestId: data.CheckoutRequestID,
    responseCode: data.ResponseCode,
    responseDescription: data.ResponseDescription,
    customerMessage: data.CustomerMessage,
  };
}

export async function queryStkStatus(checkoutRequestId: string) {
  const config = await getMpesaConfig();
  const token = await getAccessToken(config);
  const timestamp = timestampNow();
  const password = Buffer.from(`${config.shortCode}${config.passkey}${timestamp}`).toString("base64");

  const res = await fetch(`${baseUrl(config.environment)}/mpesa/stkpushquery/v1/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      BusinessShortCode: config.shortCode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    }),
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));
  return data as {
    ResponseCode?: string;
    ResultCode?: string;
    ResultDesc?: string;
    errorCode?: string;
    errorMessage?: string;
  };
}
