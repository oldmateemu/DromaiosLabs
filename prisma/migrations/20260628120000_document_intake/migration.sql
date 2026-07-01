-- CreateEnum
CREATE TYPE "IntakeDomain" AS ENUM ('BUSINESS', 'PERSONAL', 'MIXED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "IntakeSource" AS ENUM ('FOLDER', 'UPLOAD', 'EMAIL');

-- CreateEnum
CREATE TYPE "IntakeStatus" AS ENUM ('CAPTURED', 'READ', 'TRIAGED', 'IN_REVIEW', 'FILED', 'ARCHIVED', 'REJECTED', 'FAILED');

-- CreateEnum
CREATE TYPE "IntakeDisposition" AS ENUM ('ACTION', 'FILE', 'ARCHIVE', 'UNSURE');

-- AlterTable
ALTER TABLE "Action" ADD COLUMN     "domain" "IntakeDomain" NOT NULL DEFAULT 'BUSINESS';

-- CreateTable
CREATE TABLE "IntakeDocument" (
    "id" TEXT NOT NULL,
    "source" "IntakeSource" NOT NULL,
    "status" "IntakeStatus" NOT NULL DEFAULT 'CAPTURED',
    "domain" "IntakeDomain" NOT NULL DEFAULT 'UNKNOWN',
    "suggestedDomain" "IntakeDomain" NOT NULL DEFAULT 'UNKNOWN',
    "domainConfidence" DOUBLE PRECISION,
    "disposition" "IntakeDisposition",
    "docType" TEXT,
    "originalFilename" TEXT NOT NULL,
    "storedPath" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "mimeType" TEXT,
    "byteSize" INTEGER,
    "ocrText" TEXT,
    "ocrEngine" TEXT,
    "summary" TEXT,
    "triageNote" TEXT,
    "reviewerNote" TEXT,
    "sensitive" BOOLEAN NOT NULL DEFAULT true,
    "signals" JSONB,
    "suggestedAction" JSONB,
    "readAt" TIMESTAMP(3),
    "triagedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reviewedById" TEXT,
    "actionId" TEXT,

    CONSTRAINT "IntakeDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IntakeDocument_actionId_key" ON "IntakeDocument"("actionId");

-- CreateIndex
CREATE INDEX "IntakeDocument_status_idx" ON "IntakeDocument"("status");

-- CreateIndex
CREATE INDEX "IntakeDocument_domain_idx" ON "IntakeDocument"("domain");

-- CreateIndex
CREATE INDEX "IntakeDocument_capturedAt_idx" ON "IntakeDocument"("capturedAt");

-- CreateIndex
CREATE UNIQUE INDEX "IntakeDocument_contentHash_key" ON "IntakeDocument"("contentHash");

-- CreateIndex
CREATE INDEX "Action_domain_idx" ON "Action"("domain");

-- AddForeignKey
ALTER TABLE "IntakeDocument" ADD CONSTRAINT "IntakeDocument_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntakeDocument" ADD CONSTRAINT "IntakeDocument_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "Action"("id") ON DELETE SET NULL ON UPDATE CASCADE;

