import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const settings = await prisma.siteSettings.findUnique({ where: { id: "default" } });
  return NextResponse.json({
    settings: settings ?? {
      businessName: "Berna Gee",
      tagline: "Warm. Reliable. Customer-Friendly. 24/7 Support.",
      supportPhone: "0768050573",
      whatsappPhone: "0768050573",
    },
  });
}
