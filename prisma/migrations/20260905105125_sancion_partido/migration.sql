-- AlterTable
ALTER TABLE "Sancion" ADD COLUMN     "partidoId" TEXT;

-- CreateIndex
CREATE INDEX "Sancion_partidoId_idx" ON "Sancion"("partidoId");

-- AddForeignKey
ALTER TABLE "Sancion" ADD CONSTRAINT "Sancion_partidoId_fkey" FOREIGN KEY ("partidoId") REFERENCES "Partido"("id") ON DELETE SET NULL ON UPDATE CASCADE;
