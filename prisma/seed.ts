import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { encryptSecret } from "../src/lib/crypto";

const prisma = new PrismaClient();

async function main() {
  const categories = [
    { name: "Data Bundles", slug: "data", icon: "wifi", sortOrder: 1 },
    { name: "Minutes", slug: "minutes", icon: "phone", sortOrder: 2 },
    { name: "SMS", slug: "sms", icon: "message-square", sortOrder: 3 },
    { name: "Combo Deals", slug: "combo", icon: "gift", sortOrder: 4 },
  ];

  const categoryMap: Record<string, string> = {};
  for (const cat of categories) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, icon: cat.icon, sortOrder: cat.sortOrder },
      create: cat,
    });
    categoryMap[cat.slug] = created.id;
  }

  const packages = [
    // Data
    { slug: "data", name: "Hot Deal 1GB", price: 55, amountLabel: "1GB", validity: "Till Midnight", description: "Instant activation, works 24/7, valid till midnight.", badge: "HOT DEAL", sortOrder: 1 },
    { slug: "data", name: "Quick 250MB", price: 20, amountLabel: "250MB", validity: "24Hrs", description: "Standard data for everyday browsing.", badge: null, sortOrder: 2 },
    { slug: "data", name: "Midnight Gigabyte", price: 19, amountLabel: "1GB", validity: "1Hr (Strictly Midnight to 4PM)", description: "Best value data window.", badge: "BEST SELLER", sortOrder: 3 },
    { slug: "data", name: "Weekly Saver", price: 49, amountLabel: "400MB", validity: "7 Days", description: "Weekly plan for light users.", badge: "BEST SELLER", sortOrder: 4 },
    { slug: "data", name: "High Volume Pack", price: 99, amountLabel: "1.5GB", validity: "24Hrs", description: "High volume data for heavy browsing.", badge: null, sortOrder: 5 },
    { slug: "data", name: "Social Bundle", price: 50, amountLabel: "750MB + 50 SMS", validity: "24Hrs", description: "Messaging & social bundle with free WhatsApp.", badge: "BEST SELLER", sortOrder: 6 },
    { slug: "data", name: "Streamer's Pick", price: 54, amountLabel: "750MB + 50 SMS", validity: "24Hrs (WhatsApp Free)", description: "Best for daily browsing & streaming.", badge: "BEST SELLER", sortOrder: 7 },
    { slug: "data", name: "Mega Saver 2GB", price: 110, amountLabel: "2GB", validity: "24Hrs", description: "Great value for the whole day.", badge: null, sortOrder: 8 },
    // Minutes
    { slug: "minutes", name: "Quick Talk 45", price: 23, amountLabel: "45 Minutes", validity: "3 Hrs", description: "Quick call time for short conversations.", badge: null, sortOrder: 1 },
    { slug: "minutes", name: "Midnight Talk 60", price: 51, amountLabel: "60 Minutes", validity: "Till Midnight", description: "Talk time valid till midnight.", badge: null, sortOrder: 2 },
    { slug: "minutes", name: "Weekly Talk 250", price: 250, amountLabel: "250 Minutes", validity: "7 Days", description: "A full week of talk time.", badge: null, sortOrder: 3 },
    // SMS
    { slug: "sms", name: "SMS Starter", price: 5, amountLabel: "20 SMS", validity: "24Hrs", description: "Basic SMS bundle.", badge: null, sortOrder: 1 },
    { slug: "sms", name: "SMS Plus", price: 10, amountLabel: "200 SMS", validity: "1 Day", description: "More SMS for the day.", badge: null, sortOrder: 2 },
    { slug: "sms", name: "SMS Mega", price: 30, amountLabel: "1000 SMS", validity: "7 Days", description: "Weekly SMS mega bundle.", badge: null, sortOrder: 3 },
    // Combo
    { slug: "combo", name: "Tunukiwa Hourly", price: 22, amountLabel: "1GB", validity: "1 Hr", description: "Hourly data reward.", badge: null, sortOrder: 1 },
    { slug: "combo", name: "Tunukiwa Daily", price: 110, amountLabel: "2GB", validity: "24 Hrs", description: "Daily data reward.", badge: null, sortOrder: 2 },
    { slug: "combo", name: "Tunukiwa Social", price: 54, amountLabel: "750MB + 50 SMS + WhatsApp", validity: "24Hrs", description: "Social + messaging combo.", badge: null, sortOrder: 3 },
  ];

  for (const pkg of packages) {
    const { slug, ...rest } = pkg;
    const existing = await prisma.package.findFirst({
      where: { name: rest.name, categoryId: categoryMap[slug] },
    });
    if (existing) {
      await prisma.package.update({ where: { id: existing.id }, data: rest });
    } else {
      await prisma.package.create({ data: { ...rest, categoryId: categoryMap[slug] } });
    }
  }

  await prisma.siteSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      businessName: "BingwaSokoni",
      tagline: "Warm. Reliable. Instant Data, Minutes & SMS.",
      supportPhone: "0768050573",
      whatsappPhone: "0768050573",
    },
  });

  await prisma.mpesaConfig.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      environment: "sandbox",
      shortCode: "174379",
      tillType: "paybill",
      consumerKeyEnc: encryptSecret(""),
      consumerSecretEnc: encryptSecret(""),
      passkeyEnc: encryptSecret(
        "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919",
      ),
      accountReference: "BingwaSokoni",
      transactionDesc: "Data Bundle Purchase",
      callbackBaseUrl: null,
      isConfigured: false,
    },
  });

  const superAdminEmail = "annmbaya25@outlook.com";
  const existingAdmin = await prisma.admin.findUnique({ where: { email: superAdminEmail } });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash("ChangeMe123!", 12);
    await prisma.admin.create({
      data: {
        name: "Super Admin",
        email: superAdminEmail,
        passwordHash,
        role: "SUPER_ADMIN",
      },
    });
    console.log(`Created super admin: ${superAdminEmail} / ChangeMe123! (change this immediately)`);
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
