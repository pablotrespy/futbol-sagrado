-- AlterEnum
CREATE TYPE "TipoPlanilla_new" AS ENUM ('OPERADOR_MESA', 'ARBITRO', 'EQUIPOS_JUGADORES');
ALTER TABLE "formato_planilla" ALTER COLUMN "tipo" TYPE "TipoPlanilla_new" USING ("tipo"::text::"TipoPlanilla_new");
ALTER TYPE "TipoPlanilla" RENAME TO "TipoPlanilla_old";
ALTER TYPE "TipoPlanilla_new" RENAME TO "TipoPlanilla";
DROP TYPE "public"."TipoPlanilla_old";