-- Fase 2 / módulos 3 y 4: torneos, jornadas y programación de partidos.
CREATE TYPE "EstadoTorneo" AS ENUM ('BORRADOR', 'ACTIVO', 'FINALIZADO');
CREATE TYPE "EstadoPartido" AS ENUM ('PROGRAMADO', 'EN_CURSO', 'FINALIZADO', 'CANCELADO');
CREATE TABLE "Torneo" ("id" TEXT NOT NULL, "nombre" TEXT NOT NULL, "temporada" TEXT NOT NULL, "estado" "EstadoTorneo" NOT NULL DEFAULT 'BORRADOR', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Torneo_pkey" PRIMARY KEY ("id"));
CREATE TABLE "Jornada" ("id" TEXT NOT NULL, "numero" INTEGER NOT NULL, "nombre" TEXT NOT NULL, "fecha" TIMESTAMP(3) NOT NULL, "torneoId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Jornada_pkey" PRIMARY KEY ("id"));
CREATE TABLE "Partido" ("id" TEXT NOT NULL, "jornadaId" TEXT NOT NULL, "equipoLocalId" TEXT NOT NULL, "equipoVisitanteId" TEXT NOT NULL, "canchaId" TEXT NOT NULL, "inicio" TIMESTAMP(3) NOT NULL, "duracionMinutos" INTEGER NOT NULL DEFAULT 60, "estado" "EstadoPartido" NOT NULL DEFAULT 'PROGRAMADO', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Partido_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "Torneo_nombre_key" ON "Torneo"("nombre");
CREATE UNIQUE INDEX "Jornada_torneoId_numero_key" ON "Jornada"("torneoId", "numero");
CREATE INDEX "Jornada_torneoId_idx" ON "Jornada"("torneoId");
CREATE UNIQUE INDEX "Partido_jornadaId_equipoLocalId_equipoVisitanteId_key" ON "Partido"("jornadaId", "equipoLocalId", "equipoVisitanteId");
CREATE INDEX "Partido_jornadaId_idx" ON "Partido"("jornadaId");
CREATE INDEX "Partido_canchaId_inicio_idx" ON "Partido"("canchaId", "inicio");
CREATE INDEX "Partido_equipoLocalId_inicio_idx" ON "Partido"("equipoLocalId", "inicio");
CREATE INDEX "Partido_equipoVisitanteId_inicio_idx" ON "Partido"("equipoVisitanteId", "inicio");
ALTER TABLE "Jornada" ADD CONSTRAINT "Jornada_torneoId_fkey" FOREIGN KEY ("torneoId") REFERENCES "Torneo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Partido" ADD CONSTRAINT "Partido_jornadaId_fkey" FOREIGN KEY ("jornadaId") REFERENCES "Jornada"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Partido" ADD CONSTRAINT "Partido_equipoLocalId_fkey" FOREIGN KEY ("equipoLocalId") REFERENCES "Equipo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Partido" ADD CONSTRAINT "Partido_equipoVisitanteId_fkey" FOREIGN KEY ("equipoVisitanteId") REFERENCES "Equipo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Partido" ADD CONSTRAINT "Partido_canchaId_fkey" FOREIGN KEY ("canchaId") REFERENCES "Cancha"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
