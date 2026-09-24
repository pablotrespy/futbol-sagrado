-- Fase 1 / módulos 1 y 2: canchas, equipos y jugadores.
CREATE TABLE "Cancha" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "ubicacion" TEXT,
    "descripcion" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Cancha_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Equipo" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "color" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Equipo_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Jugador" (
    "id" TEXT NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "documento" TEXT,
    "fechaNacimiento" TIMESTAMP(3),
    "numeroCamiseta" INTEGER,
    "posicion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "equipoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Jugador_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Cancha_nombre_key" ON "Cancha"("nombre");
CREATE UNIQUE INDEX "Equipo_nombre_key" ON "Equipo"("nombre");
CREATE UNIQUE INDEX "Jugador_documento_key" ON "Jugador"("documento");
CREATE UNIQUE INDEX "Jugador_equipoId_numeroCamiseta_key" ON "Jugador"("equipoId", "numeroCamiseta");
CREATE INDEX "Jugador_equipoId_idx" ON "Jugador"("equipoId");
ALTER TABLE "Jugador" ADD CONSTRAINT "Jugador_equipoId_fkey" FOREIGN KEY ("equipoId") REFERENCES "Equipo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
