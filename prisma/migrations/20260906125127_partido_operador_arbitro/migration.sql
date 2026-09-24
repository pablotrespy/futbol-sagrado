-- AlterTable
ALTER TABLE "Partido" ADD COLUMN     "arbitroId" TEXT,
ADD COLUMN     "operadorId" TEXT;

-- AddForeignKey
ALTER TABLE "Partido" ADD CONSTRAINT "Partido_operadorId_fkey" FOREIGN KEY ("operadorId") REFERENCES "operador"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Partido" ADD CONSTRAINT "Partido_arbitroId_fkey" FOREIGN KEY ("arbitroId") REFERENCES "arbitro"("id") ON DELETE SET NULL ON UPDATE CASCADE;
