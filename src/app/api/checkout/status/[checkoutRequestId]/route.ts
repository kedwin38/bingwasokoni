import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { queryStkStatus } from "@/lib/mpesa";

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

  // If callback hasn't landed yet and the request has had a few seconds to
  // settle, actively query Safaricom so the UI isn't stuck on PENDING.
  if (transaction.status === "PENDING") {
    const ageMs = Date.now() - transaction.createdAt.getTime();
    if (ageMs > 6000) {
      try {
        const result = await queryStkStatus(checkoutRequestId);
        if (result.ResultCode !== undefined) {
          const resultCode = Number(result.ResultCode);
          const status = resultCode === 0 ? "SUCCESS" : "FAILED";
          const updated = await prisma.transaction.update({
            where: { checkoutRequestId },
            data: {
              status,
              resultCode,
              resultDesc: result.ResultDesc ?? null,
            },
            include: { package: true },
          });
          return NextResponse.json({ transaction: serialize(updated) });
        }
      } catch {
        // Swallow — fall through to returning current DB state (still pending).
      }
    }
    if (ageMs > 120000) {
      const updated = await prisma.transaction.update({
        where: { checkoutRequestId },
        data: { status: "TIMEOUT", resultDesc: "No response received in time." },
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
  package: { name: string; amountLabel: string } | null;
}) {
  return {
    id: t.id,
    status: t.status,
    amount: t.amount,
    phoneNumber: t.phoneNumber,
    mpesaReceiptNumber: t.mpesaReceiptNumber,
    resultDesc: t.resultDesc,
    packageName: t.package?.name ?? null,
    amountLabel: t.package?.amountLabel ?? null,
  };
}
