import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAdminSchema } from "@/lib/validation";
import { requireAdmin, requireSuperAdmin, handleApiError } from "@/lib/api-guard";
import { hashPassword } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();
    const admins = await prisma.admin.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
      },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ admins });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireSuperAdmin();
    const body = await request.json().catch(() => null);
    const parsed = createAdminSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }
    const { name, email, password, role } = parsed.data;

    const existing = await prisma.admin.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: "An admin with this email already exists." }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const admin = await prisma.admin.create({
      data: { name, email: email.toLowerCase(), passwordHash, role },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    });

    return NextResponse.json({ admin }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
