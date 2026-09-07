import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin, handleApiError, ApiError } from "@/lib/api-guard";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const current = await requireSuperAdmin();
    const { id } = await params;
    const body = await request.json().catch(() => null);

    if (id === current.sub && body?.isActive === false) {
      throw new ApiError(400, "You cannot deactivate your own account.");
    }

    const data: { isActive?: boolean; role?: string } = {};
    if (typeof body?.isActive === "boolean") data.isActive = body.isActive;
    if (body?.role === "ADMIN" || body?.role === "SUPER_ADMIN") data.role = body.role;

    const admin = await prisma.admin.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });
    return NextResponse.json({ admin });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const current = await requireSuperAdmin();
    const { id } = await params;

    if (id === current.sub) {
      throw new ApiError(400, "You cannot delete your own account.");
    }

    const target = await prisma.admin.findUnique({ where: { id } });
    if (target?.role === "SUPER_ADMIN") {
      const superAdminCount = await prisma.admin.count({ where: { role: "SUPER_ADMIN" } });
      if (superAdminCount <= 1) {
        throw new ApiError(400, "At least one super admin must remain.");
      }
    }

    await prisma.admin.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
