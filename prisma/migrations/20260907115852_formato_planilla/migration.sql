-- CreateEnum
CREATE TYPE "TipoPlanilla" AS ENUM ('OPERADOR_MESA', 'ARBITRO');

-- CreateTable
CREATE TABLE "formato_planilla" (
    "id" TEXT NOT NULL,
    "tipo" "TipoPlanilla" NOT NULL,
    "nombreArchivo" TEXT NOT NULL,
    "tipoMime" TEXT NOT NULL DEFAULT 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    "archivoPath" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "formato_planilla_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "formato_planilla_tipo_key" ON "formato_planilla"("tipo");
