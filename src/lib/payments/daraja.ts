import { initiateStkPush, queryStkStatus, MpesaError } from "@/lib/mpesa";
import { PaymentSystemError, InitiatePaymentParams, InitiatePaymentResult, PaymentStatusResult } from "./types";

export async function initiateDarajaPayment(
  params: InitiatePaymentParams,
): Promise<InitiatePaymentResult> {
  try {
    const result = await initiateStkPush({
      phone: params.phone,
      amount: params.amount,
      accountReference: params.reference,
      transactionDesc: params.description,
    });
    return {
      gateway: "DARAJA",
      providerReference: result.checkoutRequestId,
      customerMessage: result.customerMessage || "Check your phone to complete payment.",
    };
  } catch (error) {
    if (error instanceof MpesaError) {
      throw new PaymentSystemError(error.message, error.status, error.details);
    }
    throw new PaymentSystemError("Failed to initiate M-Pesa payment.");
  }
}

export async function queryDarajaStatus(providerReference: string): Promise<PaymentStatusResult | null> {
  const result = await queryStkStatus(providerReference);
  if (result.ResultCode === undefined) return null;
  const resultCode = Number(result.ResultCode);
  return {
    status: resultCode === 0 ? "SUCCESS" : "FAILED",
    resultCode,
    resultDesc: result.ResultDesc,
  };
}
