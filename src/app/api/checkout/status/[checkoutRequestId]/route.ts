import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { queryPaymentStatus } from "@/lib/payments/gateway";
import { PaymentGateway, FAILURE_SOURCE, GENERIC_PAYMENT_ERROR_MESSAGE } from "@/lib/constants";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ checkoutRequestId: string }> },
) {
  const { checkoutRequestId } = await params;

  const transaction = await prisma.transaction.findUnique({
    where: { checkoutRequestId },
    include: { package: true },
  });

  if (!transaction) {
    return NextResponse.json({ error: "Transaction not found." }, { status: 404 });
  }

  // If the provider's callback hasn't landed yet and the request has had a
  // few seconds to settle, actively poll the active gateway so the UI isn't
  // stuck on PENDING.
  if (transaction.status === "PENDING") {
    const ageMs = Date.now() - transaction.createdAt.getTime();
    if (ageMs > 6000) {
      try {
        const result = await queryPaymentStatus(transaction.gateway as PaymentGateway, checkoutRequestId);
        if (result && result.status !== "PENDING") {
          const updated = await prisma.transaction.update({
            where: { checkoutRequestId },
            data: {
              status: result.status,
              resultCode: result.resultCode ?? null,
              resultDesc: result.resultDesc ?? null,
              mpesaReceiptNumber: result.receiptNumber ?? undefined,
              failureSource: result.status === "FAILED" ? FAILURE_SOURCE.PROVIDER : null,
            },
            include: { package: true },
          });
          return NextResponse.json({ transaction: serialize(updated) });
        }
      } catch (error) {
        // The gateway itself is unreachable/misbehaving while we're polling —
        // that's our system's problem, not the customer's. Record it for the
        // admin, but keep showing the customer a normal "still waiting" state
        // until the timeout below kicks in, rather than surfacing this error.
        console.error("Payment status poll failed", error);
        await prisma.transaction.update({
          where: { checkoutRequestId },
          data: {
            resultDesc: error instanceof Error ? error.message : "Status check failed.",
            failureSource: FAILURE_SOURCE.SYSTEM,
          },
        });
      }
    }
    if (ageMs > 120000) {
      const updated = await prisma.transaction.update({
        where: { checkoutRequestId },
        data: {
          status: "TIMEOUT",
          resultDesc: transaction.resultDesc ?? "No response received in time.",
          failureSource: transaction.failureSource ?? FAILURE_SOURCE.SYSTEM,
        },
        include: { package: true },
      });
      return NextResponse.json({ transaction: serialize(updated) });
    }
  }

  return NextResponse.json({ transaction: serialize(transaction) });
}

function serialize(t: {
  id: string;
  status: string;
  amount: number;
  phoneNumber: string;
  mpesaReceiptNumber: string | null;
  resultDesc: string | null;
  failureSource: string | null;
  package: { name: string; amountLabel: string } | null;
}) {
  const failed = t.status === "FAILED" || t.status === "TIMEOUT";
  // A decline from the gateway/customer (wrong PIN, cancelled, insufficient
  // funds) is legitimate and useful for the customer to see as-is. A failure
  // on our side (bad credentials, misconfigured gateway, an outage) is never
  // the customer's fault and never their problem to read a technical reason
  // for — they get a generic message, and the real cause goes to the admin.
  const isSystemFault = failed && t.failureSource !== "PROVIDER";

  return {
    id: t.id,
    status: t.status,
    amount: t.amount,
    phoneNumber: t.phoneNumber,
    mpesaReceiptNumber: t.mpesaReceiptNumber,
    resultDesc: isSystemFault ? GENERIC_PAYMENT_ERROR_MESSAGE : t.resultDesc,
    packageName: t.package?.name ?? null,
    amountLabel: t.package?.amountLabel ?? null,
  };
}
