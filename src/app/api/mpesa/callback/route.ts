import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type CallbackItem = { Name: string; Value?: string | number };

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  try {
    const stkCallback = body?.Body?.stkCallback;
    if (!stkCallback) {
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    const checkoutRequestId: string = stkCallback.CheckoutRequestID;
    const resultCode: number = stkCallback.ResultCode;
    const resultDesc: string = stkCallback.ResultDesc;

    const items: CallbackItem[] = stkCallback.CallbackMetadata?.Item ?? [];
    const getValue = (name: string) => items.find((i) => i.Name === name)?.Value;

    const mpesaReceiptNumber = getValue("MpesaReceiptNumber") as string | undefined;

    const transaction = await prisma.transaction.findUnique({ where: { checkoutRequestId } });
    if (!transaction) {
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    await prisma.transaction.update({
      where: { checkoutRequestId },
      data: {
        status: resultCode === 0 ? "SUCCESS" : "FAILED",
        resultCode,
        resultDesc,
        mpesaReceiptNumber: mpesaReceiptNumber ?? null,
        rawCallback: JSON.stringify(body),
      },
    });

    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch (error) {
    console.error("M-Pesa callback error", error);
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }
}
