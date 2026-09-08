import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkoutSchema } from "@/lib/validation";
import { normalizeMsisdn } from "@/lib/mpesa";
import { initiatePayment, getActiveGateway } from "@/lib/payments/gateway";
import { PaymentSystemError } from "@/lib/payments/types";
import { GENERIC_PAYMENT_ERROR_MESSAGE, FAILURE_SOURCE } from "@/lib/constants";

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

  // Record which gateway is being attempted up front, so a failure that
  // happens before the provider ever responds (bad credentials, gateway not
  // configured) is still correctly attributed on the transaction — not left
  // showing the default gateway regardless of which one actually ran.
  const attemptedGateway = await getActiveGateway();

  const transaction = await prisma.transaction.create({
    data: {
      packageId: pkg.id,
      phoneNumber: normalizeMsisdn(phone),
      amount: pkg.price,
      status: "PENDING",
      gateway: attemptedGateway,
    },
  });

  try {
    const result = await initiatePayment(
      {
        phone,
        amount: pkg.price,
        transactionId: transaction.id,
        reference: `BS-${pkg.amountLabel}`.slice(0, 20),
        description: `${pkg.name} (${pkg.amountLabel})`,
      },
      attemptedGateway,
    );

    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        checkoutRequestId: result.providerReference,
      },
    });

    return NextResponse.json({
      transactionId: transaction.id,
      providerReference: result.providerReference,
      redirectUrl: result.redirectUrl ?? null,
      customerMessage: result.customerMessage,
    });
  } catch (error) {
    // The customer only ever sees a generic message. The real cause (bad
    // credentials, gateway outage, misconfiguration, etc.) is stored on the
    // transaction for an admin to see in the Transactions/Dashboard views —
    // it is never our customer's fault when this branch runs, so it must
    // never look like it to them.
    const technicalReason =
      error instanceof PaymentSystemError ? error.message : "Failed to initiate payment (unexpected error).";

    console.error("Payment initiation failed", error);

    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: "FAILED",
        resultDesc: technicalReason,
        failureSource: FAILURE_SOURCE.SYSTEM,
      },
    });

    return NextResponse.json({ error: GENERIC_PAYMENT_ERROR_MESSAGE }, { status: 502 });
  }
}
