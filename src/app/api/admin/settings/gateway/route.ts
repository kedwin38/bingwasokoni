import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { gatewaySettingsSchema } from "@/lib/validation";
import { requireAdmin, handleApiError } from "@/lib/api-guard";

export async function GET() {
  try {
    await requireAdmin();
    const row = await prisma.gatewaySettings.findUnique({ where: { id: "default" } });
    return NextResponse.json({ activeGateway: row?.activeGateway ?? "DARAJA" });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json().catch(() => null);
    const parsed = gatewaySettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const [mpesaConfig, pesapalConfig] = await Promise.all([
      prisma.mpesaConfig.findUnique({ where: { id: "default" } }),
      prisma.pesapalConfig.findUnique({ where: { id: "default" } }),
    ]);

    const targetConfigured =
      parsed.data.activeGateway === "PESAPAL" ? pesapalConfig?.isConfigured : mpesaConfig?.isConfigured;

    const updated = await prisma.gatewaySettings.upsert({
      where: { id: "default" },
      update: { activeGateway: parsed.data.activeGateway },
      create: { id: "default", activeGateway: parsed.data.activeGateway },
    });

    return NextResponse.json({
      activeGateway: updated.activeGateway,
      warning: targetConfigured
        ? null
        : `${parsed.data.activeGateway === "PESAPAL" ? "Pesapal" : "M-Pesa Daraja"} is not fully configured yet — customers will see payment errors until you finish setup.`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
