export type PublicPackage = {
  id: string;
  name: string;
  price: number;
  amountLabel: string;
  validity: string;
  description: string | null;
  badge: string | null;
  isActive: boolean;
  sortOrder: number;
};

export type PublicCategory = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  sortOrder: number;
  packages: PublicPackage[];
};

export type SiteSettings = {
  businessName: string;
  tagline: string;
  supportPhone: string;
  whatsappPhone: string;
};

export type TransactionStatus = "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED" | "TIMEOUT";

export type CheckoutStatus = {
  id: string;
  status: TransactionStatus;
  amount: number;
  phoneNumber: string;
  mpesaReceiptNumber: string | null;
  resultDesc: string | null;
  packageName: string | null;
  amountLabel: string | null;
};
