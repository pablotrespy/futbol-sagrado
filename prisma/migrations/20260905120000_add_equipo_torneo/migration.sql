-- Renombrar torneos: Plus-Clausura 2026 (ACTIVO) y Plus-Apertura 2026 (BORRADOR).
UPDATE "Torneo" SET "nombre" = 'Plus-Clausura 2026', "temporada" = '2026' WHERE "nombre" = 'Plus 50 - Clausura';
UPDATE "Torneo" SET "nombre" = 'Plus-Apertura 2026', "temporada" = '2026' WHERE "nombre" = 'Plus 50 - Apertura';

-- Agregar la columna torneoId a Equipo (nullable para permitir backfill).
ALTER TABLE "Equipo" ADD COLUMN "torneoId" TEXT;

-- Backfill: todos los equipos existentes al torneo activo (Plus-Clausura 2026).
UPDATE "Equipo" SET "torneoId" = "Torneo"."id" FROM "Torneo" WHERE "Torneo"."nombre" = 'Plus-Clausura 2026';

-- Fijar NOT NULL una vez backfilled.
ALTER TABLE "Equipo" ALTER COLUMN "torneoId" SET NOT NULL;

-- Eliminar restricción antigua de nombre único global.
DROP INDEX IF EXISTS "Equipo_nombre_key";

-- Relación con Torneo (Restrict, consistente con Split de competencia).
ALTER TABLE "Equipo" ADD CONSTRAINT "Equipo_torneoId_fkey" FOREIGN KEY ("torneoId") REFERENCES "Torneo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Unique por torneo más índice por torneoId.
CREATE UNIQUE INDEX "Equipo_torneoId_nombre_key" ON "Equipo"("torneoId", "nombre");
CREATE INDEX "Equipo_torneoId_idx" ON "Equipo"("torneoId");