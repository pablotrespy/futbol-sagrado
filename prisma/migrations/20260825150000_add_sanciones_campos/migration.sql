-- AlterEnum
ALTER TYPE "TipoTarjeta" ADD VALUE IF NOT EXISTS 'AZUL';

-- CreateEnum
CREATE TYPE "EstadoPago" AS ENUM ('PENDIENTE', 'PAGADA');

-- AlterTable
ALTER TABLE "Sancion" ADD COLUMN "tarjeta" TEXT;
ALTER TABLE "Sancion" ADD COLUMN "valorPagar" INTEGER;
ALTER TABLE "Sancion" ADD COLUMN "estadoPago" "EstadoPago" NOT NULL DEFAULT 'PENDIENTE';
