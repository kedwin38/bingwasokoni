import { prisma } from "@/lib/prisma";
import { PaymentGateway, PAYMENT_GATEWAYS } from "@/lib/constants";
import { initiateDarajaPayment, queryDarajaStatus } from "./daraja";
import { initiatePesapalPayment, queryPesapalStatus } from "./pesapal";
import { InitiatePaymentParams, InitiatePaymentResult, PaymentStatusResult } from "./types";

export async function getActiveGateway(): Promise<PaymentGateway> {
  const row = await prisma.gatewaySettings.findUnique({ where: { id: "default" } });
  const value = row?.activeGateway;
  return value === PAYMENT_GATEWAYS.PESAPAL ? PAYMENT_GATEWAYS.PESAPAL : PAYMENT_GATEWAYS.DARAJA;
}

export async function initiatePayment(
  params: InitiatePaymentParams,
  gateway?: PaymentGateway,
): Promise<InitiatePaymentResult> {
  const resolvedGateway = gateway ?? (await getActiveGateway());
  if (resolvedGateway === PAYMENT_GATEWAYS.PESAPAL) {
    return initiatePesapalPayment(params);
  }
  return initiateDarajaPayment(params);
}

export async function queryPaymentStatus(
  gateway: PaymentGateway,
  providerReference: string,
): Promise<PaymentStatusResult | null> {
  if (gateway === PAYMENT_GATEWAYS.PESAPAL) {
    return queryPesapalStatus(providerReference);
  }
  return queryDarajaStatus(providerReference);
}
