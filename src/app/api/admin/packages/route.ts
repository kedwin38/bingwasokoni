import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { packageInputSchema } from "@/lib/validation";
import { requireAdmin, handleApiError } from "@/lib/api-guard";

export async function GET() {
  try {
    await requireAdmin();
    const packages = await prisma.package.findMany({
      include: { category: true },
      orderBy: [{ categoryId: "asc" }, { sortOrder: "asc" }],
    });
    return NextResponse.json({ packages });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json().catch(() => null);
    const parsed = packageInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }
    const pkg = await prisma.package.create({ data: parsed.data });
    return NextResponse.json({ package: pkg }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
