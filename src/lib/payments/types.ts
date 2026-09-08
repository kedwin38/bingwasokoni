import { PaymentGateway } from "@/lib/constants";

export class PaymentSystemError extends Error {
  constructor(
    message: string,
    public status?: number,
    public details?: unknown,
  ) {
    super(message);
    this.name = "PaymentSystemError";
  }
}

export type InitiatePaymentParams = {
  phone: string;
  amount: number;
  transactionId: string;
  reference: string;
  description: string;
};

export type InitiatePaymentResult = {
  gateway: PaymentGateway;
  providerReference: string;
  redirectUrl?: string;
  customerMessage: string;
};

export type PaymentStatusResult = {
  status: "PENDING" | "SUCCESS" | "FAILED";
  receiptNumber?: string;
  resultCode?: number;
  resultDesc?: string;
};
