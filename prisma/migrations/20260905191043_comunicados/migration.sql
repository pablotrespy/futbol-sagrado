-- CreateTable
CREATE TABLE "comunicado" (
    "id" TEXT NOT NULL,
    "torneoId" TEXT NOT NULL,
    "resolucion" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "nombreArchivo" TEXT NOT NULL,
    "tipoMime" TEXT NOT NULL DEFAULT 'application/pdf',
    "archivoPath" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comunicado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "comunicado_torneoId_idx" ON "comunicado"("torneoId");

-- AddForeignKey
ALTER TABLE "comunicado" ADD CONSTRAINT "comunicado_torneoId_fkey" FOREIGN KEY ("torneoId") REFERENCES "Torneo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
