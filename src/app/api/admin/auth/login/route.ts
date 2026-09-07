import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validation";
import { verifyPassword, createSessionToken, setSessionCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email and password." }, { status: 400 });
  }

  const { email, password } = parsed.data;
  const admin = await prisma.admin.findUnique({ where: { email: email.toLowerCase() } });

  if (!admin || !admin.isActive) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const valid = await verifyPassword(password, admin.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const token = await createSessionToken({
    sub: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role as "SUPER_ADMIN" | "ADMIN",
  });
  await setSessionCookie(token);
  await prisma.admin.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });

  return NextResponse.json({
    admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
  });
}
