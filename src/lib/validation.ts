import { z } from "zod";

export const checkoutSchema = z.object({
  packageId: z.string().min(1),
  phone: z
    .string()
    .min(9, "Enter a valid phone number")
    .max(15, "Enter a valid phone number"),
});

export const contactSchema = z.object({
  name: z.string().min(2, "Name is too short").max(100),
  phone: z.string().min(9, "Enter a valid phone number").max(15),
  email: z.union([z.string().email(), z.literal("")]).optional(),
  message: z.string().min(5, "Message is too short").max(2000),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const packageInputSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(2).max(120),
  price: z.number().int().positive(),
  amountLabel: z.string().min(1).max(60),
  validity: z.string().min(1).max(60),
  description: z.string().max(500).optional().nullable(),
  badge: z.string().max(40).optional().nullable(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export const categoryInputSchema = z.object({
  name: z.string().min(2).max(60),
  slug: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers and dashes"),
  icon: z.string().max(40).optional().nullable(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export const mpesaConfigInputSchema = z.object({
  environment: z.enum(["sandbox", "production"]),
  shortCode: z.string().min(3).max(12),
  tillType: z.enum(["paybill", "till"]),
  consumerKey: z.string().max(200).optional(),
  consumerSecret: z.string().max(200).optional(),
  passkey: z.string().max(300).optional(),
  accountReference: z.string().min(1).max(40),
  transactionDesc: z.string().min(1).max(80),
  callbackBaseUrl: z.string().url().optional().nullable(),
});

export const pesapalConfigInputSchema = z.object({
  environment: z.enum(["sandbox", "production"]),
  consumerKey: z.string().max(200).optional(),
  consumerSecret: z.string().max(200).optional(),
  callbackBaseUrl: z.string().url().optional().nullable(),
});

export const gatewaySettingsSchema = z.object({
  activeGateway: z.enum(["DARAJA", "PESAPAL"]),
});

export const createAdminSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["SUPER_ADMIN", "ADMIN"]).default("ADMIN"),
});

export const siteSettingsSchema = z.object({
  businessName: z.string().min(2).max(80),
  tagline: z.string().min(2).max(160),
  supportPhone: z.string().min(9).max(15),
  whatsappPhone: z.string().min(9).max(15),
});
