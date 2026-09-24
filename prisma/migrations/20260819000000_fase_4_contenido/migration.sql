-- Fase 4 / módulos 8 y 9: crónicas, aprobación y publicaciones externas.
CREATE TYPE "EstadoCronica" AS ENUM ('BORRADOR','APROBADA','PUBLICADA','ERROR');
CREATE TYPE "CanalPublicacion" AS ENUM ('X','INSTAGRAM');
CREATE TABLE "Cronica" ("id" TEXT PRIMARY KEY,"partidoId" TEXT NOT NULL,"titulo" TEXT NOT NULL,"texto" TEXT NOT NULL,"estado" "EstadoCronica" NOT NULL DEFAULT 'BORRADOR',"aprobadaAt" TIMESTAMP(3),"publicadaAt" TIMESTAMP(3),"errorDetalle" TEXT,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL);
CREATE TABLE "Publicacion" ("id" TEXT PRIMARY KEY,"cronicaId" TEXT NOT NULL,"canal" "CanalPublicacion" NOT NULL,"externalId" TEXT,"publicadaAt" TIMESTAMP(3),"errorDetalle" TEXT,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE UNIQUE INDEX "Cronica_partidoId_key" ON "Cronica"("partidoId"); CREATE UNIQUE INDEX "Publicacion_cronicaId_canal_key" ON "Publicacion"("cronicaId","canal");
ALTER TABLE "Cronica" ADD FOREIGN KEY ("partidoId") REFERENCES "Partido"("id") ON DELETE CASCADE; ALTER TABLE "Publicacion" ADD FOREIGN KEY ("cronicaId") REFERENCES "Cronica"("id") ON DELETE CASCADE;
