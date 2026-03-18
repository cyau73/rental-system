/*
  Warnings:

  - You are about to drop the column `rentalDuration` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `rentalStart` on the `Property` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Property" DROP COLUMN "rentalDuration",
DROP COLUMN "rentalStart",
ADD COLUMN     "builtUp" TEXT,
ADD COLUMN     "landArea" TEXT,
ADD COLUMN     "type" TEXT;

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "endDate" TIMESTAMP(3),
ALTER COLUMN "rentalAmount" DROP NOT NULL,
ALTER COLUMN "startDate" DROP NOT NULL,
ALTER COLUMN "securityDeposit" DROP NOT NULL,
ALTER COLUMN "utilityDeposit" DROP NOT NULL;
