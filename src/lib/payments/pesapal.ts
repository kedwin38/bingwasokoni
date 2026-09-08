import { submitPesapalOrder, getPesapalTransactionStatus, PesapalError } from "@/lib/pesapal";
import { PaymentSystemError, InitiatePaymentParams, InitiatePaymentResult, PaymentStatusResult } from "./types";

export async function initiatePesapalPayment(
  params: InitiatePaymentParams,
): Promise<InitiatePaymentResult> {
  try {
    const result = await submitPesapalOrder({
      transactionId: params.transactionId,
      amount: params.amount,
      phone: params.phone,
      description: params.description,
    });
    return {
      gateway: "PESAPAL",
      providerReference: result.orderTrackingId,
      redirectUrl: result.redirectUrl,
      customerMessage: "Complete your payment in the window that just opened.",
    };
  } catch (error) {
    if (error instanceof PesapalError) {
      throw new PaymentSystemError(error.message, error.status, error.details);
    }
    throw new PaymentSystemError("Failed to initiate Pesapal payment.");
  }
}

export async function queryPesapalStatus(providerReference: string): Promise<PaymentStatusResult> {
  const result = await getPesapalTransactionStatus(providerReference);
  if (result.statusCode === 1) {
    return { status: "SUCCESS", receiptNumber: result.confirmationCode, resultDesc: result.description };
  }
  if (result.statusCode === 2 || result.statusCode === 3) {
    return { status: "FAILED", resultDesc: result.description };
  }
  return { status: "PENDING", resultDesc: result.description };
}
