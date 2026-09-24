-- DropForeignKey
ALTER TABLE "Acta" DROP CONSTRAINT "Acta_partidoId_fkey";

-- DropForeignKey
ALTER TABLE "Alineacion" DROP CONSTRAINT "Alineacion_actaId_fkey";

-- DropForeignKey
ALTER TABLE "Alineacion" DROP CONSTRAINT "Alineacion_jugadorId_fkey";

-- DropForeignKey
ALTER TABLE "ClasificacionEquipo" DROP CONSTRAINT "ClasificacionEquipo_equipoId_fkey";

-- DropForeignKey
ALTER TABLE "ClasificacionEquipo" DROP CONSTRAINT "ClasificacionEquipo_torneoId_fkey";

-- DropForeignKey
ALTER TABLE "Cronica" DROP CONSTRAINT "Cronica_partidoId_fkey";

-- DropForeignKey
ALTER TABLE "EstadisticaJugador" DROP CONSTRAINT "EstadisticaJugador_jugadorId_fkey";

-- DropForeignKey
ALTER TABLE "EstadisticaJugador" DROP CONSTRAINT "EstadisticaJugador_torneoId_fkey";

-- DropForeignKey
ALTER TABLE "Gol" DROP CONSTRAINT "Gol_actaId_fkey";

-- DropForeignKey
ALTER TABLE "Gol" DROP CONSTRAINT "Gol_equipoId_fkey";

-- DropForeignKey
ALTER TABLE "Gol" DROP CONSTRAINT "Gol_jugadorId_fkey";

-- DropForeignKey
ALTER TABLE "Publicacion" DROP CONSTRAINT "Publicacion_cronicaId_fkey";

-- DropForeignKey
ALTER TABLE "Sancion" DROP CONSTRAINT "Sancion_jugadorId_fkey";

-- DropForeignKey
ALTER TABLE "Sancion" DROP CONSTRAINT "Sancion_torneoId_fkey";

-- DropForeignKey
ALTER TABLE "Tarjeta" DROP CONSTRAINT "Tarjeta_actaId_fkey";

-- DropForeignKey
ALTER TABLE "Tarjeta" DROP CONSTRAINT "Tarjeta_jugadorId_fkey";

-- AddForeignKey
ALTER TABLE "Cronica" ADD CONSTRAINT "Cronica_partidoId_fkey" FOREIGN KEY ("partidoId") REFERENCES "Partido"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Publicacion" ADD CONSTRAINT "Publicacion_cronicaId_fkey" FOREIGN KEY ("cronicaId") REFERENCES "Cronica"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Acta" ADD CONSTRAINT "Acta_partidoId_fkey" FOREIGN KEY ("partidoId") REFERENCES "Partido"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alineacion" ADD CONSTRAINT "Alineacion_actaId_fkey" FOREIGN KEY ("actaId") REFERENCES "Acta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alineacion" ADD CONSTRAINT "Alineacion_jugadorId_fkey" FOREIGN KEY ("jugadorId") REFERENCES "Jugador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gol" ADD CONSTRAINT "Gol_actaId_fkey" FOREIGN KEY ("actaId") REFERENCES "Acta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gol" ADD CONSTRAINT "Gol_jugadorId_fkey" FOREIGN KEY ("jugadorId") REFERENCES "Jugador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gol" ADD CONSTRAINT "Gol_equipoId_fkey" FOREIGN KEY ("equipoId") REFERENCES "Equipo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarjeta" ADD CONSTRAINT "Tarjeta_actaId_fkey" FOREIGN KEY ("actaId") REFERENCES "Acta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarjeta" ADD CONSTRAINT "Tarjeta_jugadorId_fkey" FOREIGN KEY ("jugadorId") REFERENCES "Jugador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sancion" ADD CONSTRAINT "Sancion_jugadorId_fkey" FOREIGN KEY ("jugadorId") REFERENCES "Jugador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sancion" ADD CONSTRAINT "Sancion_torneoId_fkey" FOREIGN KEY ("torneoId") REFERENCES "Torneo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClasificacionEquipo" ADD CONSTRAINT "ClasificacionEquipo_torneoId_fkey" FOREIGN KEY ("torneoId") REFERENCES "Torneo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClasificacionEquipo" ADD CONSTRAINT "ClasificacionEquipo_equipoId_fkey" FOREIGN KEY ("equipoId") REFERENCES "Equipo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstadisticaJugador" ADD CONSTRAINT "EstadisticaJugador_torneoId_fkey" FOREIGN KEY ("torneoId") REFERENCES "Torneo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstadisticaJugador" ADD CONSTRAINT "EstadisticaJugador_jugadorId_fkey" FOREIGN KEY ("jugadorId") REFERENCES "Jugador"("id") ON DELETE CASCADE ON UPDATE CASCADE;
