import { NextResponse } from "next/server";
import { getCurrentAdmin, AdminSessionPayload } from "@/lib/auth";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function requireAdmin(): Promise<AdminSessionPayload> {
  const admin = await getCurrentAdmin();
  if (!admin) throw new ApiError(401, "Not authenticated");
  return admin;
}

export async function requireSuperAdmin(): Promise<AdminSessionPayload> {
  const admin = await requireAdmin();
  if (admin.role !== "SUPER_ADMIN") throw new ApiError(403, "Super admin access required");
  return admin;
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  console.error(error);
  return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
}
