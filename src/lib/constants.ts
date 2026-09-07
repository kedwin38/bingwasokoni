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
