import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const settings = await prisma.siteSettings.findUnique({ where: { id: "default" } });
  return NextResponse.json({
    settings: settings ?? {
      businessName: "BingwaSokoni",
      tagline: "Fast. Reliable. Instant Data.",
      supportPhone: "0768050573",
      whatsappPhone: "0768050573",
    },
  });
}
