import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, handleApiError } from "@/lib/api-guard";

export async function GET() {
  try {
    await requireAdmin();
    const messages = await prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ messages });
  } catch (error) {
    return handleApiError(error);
  }
}
