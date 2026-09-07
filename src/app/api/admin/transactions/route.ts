import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, handleApiError } from "@/lib/api-guard";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const transactions = await prisma.transaction.findMany({
      where: status ? { status } : undefined,
      include: { package: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json({ transactions });
  } catch (error) {
    return handleApiError(error);
  }
}
