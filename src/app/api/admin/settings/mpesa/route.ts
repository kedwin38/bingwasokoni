import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mpesaConfigInputSchema } from "@/lib/validation";
import { requireAdmin, handleApiError } from "@/lib/api-guard";
import { decryptSecret, encryptSecret, maskSecret } from "@/lib/crypto";

export async function GET() {
  try {
    await requireAdmin();
    const config = await prisma.mpesaConfig.findUnique({ where: { id: "default" } });
    if (!config) {
      return NextResponse.json({
        config: {
          environment: "sandbox",
          shortCode: "174379",
          tillType: "paybill",
          consumerKeyMasked: "",
          consumerSecretMasked: "",
          passkeyMasked: "",
          accountReference: "BernaGee",
          transactionDesc: "Data Bundle Purchase",
          callbackBaseUrl: "",
          isConfigured: false,
        },
      });
    }
    return NextResponse.json({
      config: {
        environment: config.environment,
        shortCode: config.shortCode,
        tillType: config.tillType,
        consumerKeyMasked: maskSecret(decryptSecret(config.consumerKeyEnc)),
        consumerSecretMasked: maskSecret(decryptSecret(config.consumerSecretEnc)),
        passkeyMasked: maskSecret(decryptSecret(config.passkeyEnc)),
        accountReference: config.accountReference,
        transactionDesc: config.transactionDesc,
        callbackBaseUrl: config.callbackBaseUrl ?? "",
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
    const parsed = mpesaConfigInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const existing = await prisma.mpesaConfig.findUnique({ where: { id: "default" } });
    const data = parsed.data;

    const consumerKeyEnc = data.consumerKey
      ? encryptSecret(data.consumerKey)
      : existing?.consumerKeyEnc ?? "";
    const consumerSecretEnc = data.consumerSecret
      ? encryptSecret(data.consumerSecret)
      : existing?.consumerSecretEnc ?? "";
    const passkeyEnc = data.passkey ? encryptSecret(data.passkey) : existing?.passkeyEnc ?? "";

    const isConfigured = Boolean(
      consumerKeyEnc && consumerSecretEnc && passkeyEnc && data.shortCode && data.callbackBaseUrl,
    );

    const updated = await prisma.mpesaConfig.upsert({
      where: { id: "default" },
      update: {
        environment: data.environment,
        shortCode: data.shortCode,
        tillType: data.tillType,
        consumerKeyEnc,
        consumerSecretEnc,
        passkeyEnc,
        accountReference: data.accountReference,
        transactionDesc: data.transactionDesc,
        callbackBaseUrl: data.callbackBaseUrl ?? null,
        isConfigured,
      },
      create: {
        id: "default",
        environment: data.environment,
        shortCode: data.shortCode,
        tillType: data.tillType,
        consumerKeyEnc,
        consumerSecretEnc,
        passkeyEnc,
        accountReference: data.accountReference,
        transactionDesc: data.transactionDesc,
        callbackBaseUrl: data.callbackBaseUrl ?? null,
        isConfigured,
      },
    });

    return NextResponse.json({ ok: true, isConfigured: updated.isConfigured });
  } catch (error) {
    return handleApiError(error);
  }
}
