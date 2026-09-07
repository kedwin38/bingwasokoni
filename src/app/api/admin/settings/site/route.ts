import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { siteSettingsSchema } from "@/lib/validation";
import { requireAdmin, handleApiError } from "@/lib/api-guard";

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json().catch(() => null);
    const parsed = siteSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }
    const settings = await prisma.siteSettings.upsert({
      where: { id: "default" },
      update: parsed.data,
      create: { id: "default", ...parsed.data },
    });
    return NextResponse.json({ settings });
  } catch (error) {
    return handleApiError(error);
  }
}
