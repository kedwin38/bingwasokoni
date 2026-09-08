import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pesapalConfigInputSchema } from "@/lib/validation";
import { requireAdmin, handleApiError } from "@/lib/api-guard";
import { decryptSecret, encryptSecret, maskSecret } from "@/lib/crypto";
import { registerPesapalIpn, PesapalError } from "@/lib/pesapal";

export async function GET() {
  try {
    await requireAdmin();
    const config = await prisma.pesapalConfig.findUnique({ where: { id: "default" } });
    if (!config) {
      return NextResponse.json({
        config: {
          environment: "sandbox",
          consumerKeyMasked: "",
          consumerSecretMasked: "",
          callbackBaseUrl: "",
          ipnRegistered: false,
          isConfigured: false,
        },
      });
    }
    return NextResponse.json({
      config: {
        environment: config.environment,
        consumerKeyMasked: maskSecret(decryptSecret(config.consumerKeyEnc)),
        consumerSecretMasked: maskSecret(decryptSecret(config.consumerSecretEnc)),
        callbackBaseUrl: config.callbackBaseUrl ?? "",
        ipnRegistered: Boolean(config.ipnId),
        isConfigured: config.isConfigured,
        updatedAt: config.updatedAt,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json().catch(() => null);
    const parsed = pesapalConfigInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const existing = await prisma.pesapalConfig.findUnique({ where: { id: "default" } });
    const data = parsed.data;

    const consumerKeyEnc = data.consumerKey ? encryptSecret(data.consumerKey) : existing?.consumerKeyEnc ?? "";
    const consumerSecretEnc = data.consumerSecret
      ? encryptSecret(data.consumerSecret)
      : existing?.consumerSecretEnc ?? "";

    const callbackChanged = (data.callbackBaseUrl ?? null) !== (existing?.callbackBaseUrl ?? null);
    const credsChanged = Boolean(data.consumerKey || data.consumerSecret);

    let ipnId = existing?.ipnId ?? null;
    let ipnUrl = existing?.ipnUrl ?? null;
    let ipnError: string | null = null;

    const hasCreds = Boolean(consumerKeyEnc && consumerSecretEnc);
    const needsIpnRegistration = hasCreds && data.callbackBaseUrl && (!ipnId || callbackChanged || credsChanged);

    // Persist the rest first so registerPesapalIpn (which reads config back
    // from the DB) sees the credentials/environment the admin just entered.
    await prisma.pesapalConfig.upsert({
      where: { id: "default" },
      update: {
        environment: data.environment,
        consumerKeyEnc,
        consumerSecretEnc,
        callbackBaseUrl: data.callbackBaseUrl ?? null,
      },
      create: {
        id: "default",
        environment: data.environment,
        consumerKeyEnc,
        consumerSecretEnc,
        callbackBaseUrl: data.callbackBaseUrl ?? null,
      },
    });

    if (needsIpnRegistration && data.callbackBaseUrl) {
      try {
        const registered = await registerPesapalIpn(data.callbackBaseUrl);
        ipnId = registered.ipnId;
        ipnUrl = registered.ipnUrl;
      } catch (error) {
        ipnError = error instanceof PesapalError ? error.message : "Failed to register Pesapal IPN URL.";
      }
    }

    const isConfigured = Boolean(hasCreds && data.callbackBaseUrl && ipnId);

    const updated = await prisma.pesapalConfig.update({
      where: { id: "default" },
      data: { ipnId, ipnUrl, isConfigured },
    });

    return NextResponse.json({
      ok: true,
      isConfigured: updated.isConfigured,
      warning: ipnError ? `Credentials saved, but ${ipnError}` : null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
