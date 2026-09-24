// Fase 0: configuración central de Prisma 7 para PostgreSQL.
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: {
    url: env("DATABASE_URL"),
    // BD sombra para diff de migraciones sin TTY (local).
    shadowDatabaseUrl: "postgresql://padres_app:padres_dev_password@localhost:5433/padres_plus_50_shadow?schema=public",
  },
});
