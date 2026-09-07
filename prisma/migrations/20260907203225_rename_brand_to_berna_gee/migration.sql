-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MpesaConfig" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "environment" TEXT NOT NULL DEFAULT 'sandbox',
    "shortCode" TEXT NOT NULL DEFAULT '174379',
    "tillType" TEXT NOT NULL DEFAULT 'paybill',
    "consumerKeyEnc" TEXT NOT NULL DEFAULT '',
    "consumerSecretEnc" TEXT NOT NULL DEFAULT '',
    "passkeyEnc" TEXT NOT NULL DEFAULT '',
    "accountReference" TEXT NOT NULL DEFAULT 'BernaGee',
    "transactionDesc" TEXT NOT NULL DEFAULT 'Data Bundle Purchase',
    "callbackBaseUrl" TEXT,
    "isConfigured" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_MpesaConfig" ("accountReference", "callbackBaseUrl", "consumerKeyEnc", "consumerSecretEnc", "environment", "id", "isConfigured", "passkeyEnc", "shortCode", "tillType", "transactionDesc", "updatedAt") SELECT "accountReference", "callbackBaseUrl", "consumerKeyEnc", "consumerSecretEnc", "environment", "id", "isConfigured", "passkeyEnc", "shortCode", "tillType", "transactionDesc", "updatedAt" FROM "MpesaConfig";
DROP TABLE "MpesaConfig";
ALTER TABLE "new_MpesaConfig" RENAME TO "MpesaConfig";
CREATE TABLE "new_SiteSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "businessName" TEXT NOT NULL DEFAULT 'Berna Gee',
    "tagline" TEXT NOT NULL DEFAULT 'Warm. Reliable. Customer-Friendly. 24/7 Support.',
    "supportPhone" TEXT NOT NULL DEFAULT '0768050573',
    "whatsappPhone" TEXT NOT NULL DEFAULT '0768050573',
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_SiteSettings" ("businessName", "id", "supportPhone", "tagline", "updatedAt", "whatsappPhone") SELECT "businessName", "id", "supportPhone", "tagline", "updatedAt", "whatsappPhone" FROM "SiteSettings";
DROP TABLE "SiteSettings";
ALTER TABLE "new_SiteSettings" RENAME TO "SiteSettings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
