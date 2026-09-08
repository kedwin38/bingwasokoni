-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "failureSource" TEXT,
ADD COLUMN     "gateway" TEXT NOT NULL DEFAULT 'DARAJA';

-- CreateTable
CREATE TABLE "PesapalConfig" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "environment" TEXT NOT NULL DEFAULT 'sandbox',
    "consumerKeyEnc" TEXT NOT NULL DEFAULT '',
    "consumerSecretEnc" TEXT NOT NULL DEFAULT '',
    "ipnId" TEXT,
    "ipnUrl" TEXT,
    "callbackBaseUrl" TEXT,
    "isConfigured" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PesapalConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GatewaySettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "activeGateway" TEXT NOT NULL DEFAULT 'DARAJA',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GatewaySettings_pkey" PRIMARY KEY ("id")
);
