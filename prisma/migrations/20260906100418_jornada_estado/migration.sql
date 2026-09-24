-- CreateEnum
CREATE TYPE "EstadoJornada" AS ENUM ('NORMAL', 'SUSPENDIDA', 'CANCELADA');

-- AlterTable
ALTER TABLE "Jornada" ADD COLUMN     "estado" "EstadoJornada" NOT NULL DEFAULT 'NORMAL';
