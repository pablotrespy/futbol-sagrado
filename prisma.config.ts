// Fase 0: configuración central de Prisma 7 para PostgreSQL.
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: {
    // Prisma CLI usa la conexión directa de Neon; la app conserva DATABASE_URL pooled.
    url: env("DATABASE_URL_UNPOOLED"),
  },
});
