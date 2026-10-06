-- CreateTable
CREATE TABLE "BatchVerificationAuditItem" (
    "id" SERIAL NOT NULL,
    "auditId" INTEGER NOT NULL,
    "componentName" TEXT NOT NULL,
    "expectedQty" INTEGER NOT NULL,
    "actualQty" INTEGER,
    "status" "VerificationStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BatchVerificationAuditItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BatchVerificationAuditItem_auditId_idx" ON "BatchVerificationAuditItem"("auditId");

-- AddForeignKey
ALTER TABLE "BatchVerificationAuditItem" ADD CONSTRAINT "BatchVerificationAuditItem_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "BatchVerificationAudit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
