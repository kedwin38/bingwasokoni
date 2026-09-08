import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPesapalTransactionStatus } from "@/lib/pesapal";
import { FAILURE_SOURCE } from "@/lib/constants";

async function handleIpn(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderTrackingId = searchParams.get("OrderTrackingId") ?? searchParams.get("orderTrackingId");
  const orderMerchantReference =
    searchParams.get("OrderMerchantReference") ?? searchParams.get("orderMerchantReference");
  const orderNotificationType =
    searchParams.get("OrderNotificationType") ?? searchParams.get("orderNotificationType") ?? "IPNCHANGE";

  const ack = (status: number) =>
    NextResponse.json({
      orderNotificationType,
      orderTrackingId: orderTrackingId ?? "",
      orderMerchantReference: orderMerchantReference ?? "",
      status,
    });

  if (!orderTrackingId) {
    return ack(200);
  }

  try {
    const transaction = await prisma.transaction.findUnique({
      where: { checkoutRequestId: orderTrackingId },
    });
    if (!transaction) return ack(200);

    const result = await getPesapalTransactionStatus(orderTrackingId);
    const status = result.statusCode === 1 ? "SUCCESS" : result.statusCode === 0 ? "PENDING" : "FAILED";

    if (status !== "PENDING") {
      await prisma.transaction.update({
        where: { checkoutRequestId: orderTrackingId },
        data: {
          status,
          resultDesc: result.description,
          mpesaReceiptNumber: result.confirmationCode ?? null,
          rawCallback: JSON.stringify({ orderTrackingId, orderMerchantReference, result }),
          failureSource: status === "FAILED" ? FAILURE_SOURCE.PROVIDER : null,
        },
      });
    }

    return ack(200);
  } catch (error) {
    console.error("Pesapal IPN handling error", error);
    return ack(200);
  }
}

export async function GET(request: NextRequest) {
  return handleIpn(request);
}

export async function POST(request: NextRequest) {
  return handleIpn(request);
}
