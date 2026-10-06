/*
  Warnings:

  - The values [VERIFIED,SHORTAGE] on the enum `VerificationStatus` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `actualFabricUsed` to the `CuttingOrder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fabricRollId` to the `CuttingOrder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `standardFabricPerUnit` to the `Recipe` table without a default value. This is not possible if the table is not empty.
  - Added the required column `wastageCap` to the `Recipe` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "VerificationDecision" AS ENUM ('APPROVED', 'REJECTED');

-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'REJECTED';

-- AlterEnum
BEGIN;
CREATE TYPE "VerificationStatus_new" AS ENUM ('PENDING', 'GREEN', 'YELLOW', 'RED');
ALTER TABLE "public"."VerificationItem" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "VerificationItem" ALTER COLUMN "status" TYPE "VerificationStatus_new" USING ("status"::text::"VerificationStatus_new");
ALTER TABLE "VerificationLog" ALTER COLUMN "previousStatus" TYPE "VerificationStatus_new" USING ("previousStatus"::text::"VerificationStatus_new");
ALTER TABLE "VerificationLog" ALTER COLUMN "newStatus" TYPE "VerificationStatus_new" USING ("newStatus"::text::"VerificationStatus_new");
ALTER TYPE "VerificationStatus" RENAME TO "VerificationStatus_old";
ALTER TYPE "VerificationStatus_new" RENAME TO "VerificationStatus";
DROP TYPE "public"."VerificationStatus_old";
ALTER TABLE "VerificationItem" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterTable
ALTER TABLE "CuttingOrder" ADD COLUMN     "actualFabricUsed" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "fabricRollId" TEXT NOT NULL,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "verifiedAt" TIMESTAMP(3),
ADD COLUMN     "verifiedById" INTEGER;

-- AlterTable
ALTER TABLE "Recipe" ADD COLUMN     "standardFabricPerUnit" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "wastageCap" DOUBLE PRECISION NOT NULL;

-- CreateTable
CREATE TABLE "BatchVerificationAudit" (
    "id" SERIAL NOT NULL,
    "cuttingOrderId" INTEGER NOT NULL,
    "verifierId" INTEGER NOT NULL,
    "decision" "VerificationDecision" NOT NULL,
    "rejectionReason" TEXT,
    "actualFabricUsed" DOUBLE PRECISION NOT NULL,
    "standardFabricExpected" DOUBLE PRECISION NOT NULL,
    "wastagePercentage" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BatchVerificationAudit_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CuttingOrder" ADD CONSTRAINT "CuttingOrder_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchVerificationAudit" ADD CONSTRAINT "BatchVerificationAudit_cuttingOrderId_fkey" FOREIGN KEY ("cuttingOrderId") REFERENCES "CuttingOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchVerificationAudit" ADD CONSTRAINT "BatchVerificationAudit_verifierId_fkey" FOREIGN KEY ("verifierId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
