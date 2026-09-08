export const ADMIN_ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
} as const;
export type AdminRole = (typeof ADMIN_ROLES)[keyof typeof ADMIN_ROLES];

export const TRANSACTION_STATUS = {
  PENDING: "PENDING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
  TIMEOUT: "TIMEOUT",
} as const;
export type TransactionStatusType = (typeof TRANSACTION_STATUS)[keyof typeof TRANSACTION_STATUS];

export const MESSAGE_STATUS = {
  NEW: "NEW",
  READ: "READ",
  RESOLVED: "RESOLVED",
} as const;
export type MessageStatusType = (typeof MESSAGE_STATUS)[keyof typeof MESSAGE_STATUS];

export const PAYMENT_GATEWAYS = {
  DARAJA: "DARAJA",
  PESAPAL: "PESAPAL",
} as const;
export type PaymentGateway = (typeof PAYMENT_GATEWAYS)[keyof typeof PAYMENT_GATEWAYS];

/// SYSTEM = our own configuration/API-call failure, not the customer's fault.
/// PROVIDER = the gateway (or the customer, e.g. cancelled/insufficient funds) declined the request.
export const FAILURE_SOURCE = {
  SYSTEM: "SYSTEM",
  PROVIDER: "PROVIDER",
} as const;
export type FailureSourceType = (typeof FAILURE_SOURCE)[keyof typeof FAILURE_SOURCE];

export const GENERIC_PAYMENT_ERROR_MESSAGE =
  "We couldn't process your payment right now. Please try again in a moment, or contact support if this keeps happening.";
