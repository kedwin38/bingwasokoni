import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkoutSchema } from "@/lib/validation";
import { initiateStkPush, MpesaError, normalizeMsisdn } from "@/lib/mpesa";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { packageId, phone } = parsed.data;

  const pkg = await prisma.package.findUnique({ where: { id: packageId } });
  if (!pkg || !pkg.isActive) {
    return NextResponse.json({ error: "This package is no longer available." }, { status: 404 });
  }

  const transaction = await prisma.transaction.create({
    data: {
      packageId: pkg.id,
      phoneNumber: normalizeMsisdn(phone),
      amount: pkg.price,
      status: "PENDING",
    },
  });

  try {
    const result = await initiateStkPush({
      phone,
      amount: pkg.price,
      accountReference: `BS-${pkg.amountLabel}`.slice(0, 20),
      transactionDesc: `${pkg.name} (${pkg.amountLabel})`,
    });

    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        merchantRequestId: result.merchantRequestId,
        checkoutRequestId: result.checkoutRequestId,
      },
    });

    return NextResponse.json({
      transactionId: transaction.id,
      checkoutRequestId: result.checkoutRequestId,
      customerMessage: result.customerMessage,
    });
  } catch (error) {
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: "FAILED",
        resultDesc: error instanceof MpesaError ? error.message : "Failed to initiate payment.",
      },
    });

    const message =
      error instanceof MpesaError ? error.message : "Failed to initiate payment. Please try again.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
