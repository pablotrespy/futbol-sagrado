-- AlterTable
ALTER TABLE "user" ADD COLUMN     "torneoId" TEXT;

-- CreateIndex
CREATE INDEX "user_torneoId_idx" ON "user"("torneoId");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_torneoId_fkey" FOREIGN KEY ("torneoId") REFERENCES "Torneo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
