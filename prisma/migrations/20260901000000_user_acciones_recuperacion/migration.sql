-- AlterTable
ALTER TABLE "user" ADD COLUMN     "displayUsername" TEXT,
ADD COLUMN     "documento" TEXT,
ADD COLUMN     "telefono" TEXT,
ADD COLUMN     "username" TEXT;

-- CreateTable
CREATE TABLE "password_reset_token" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_token_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "password_reset_token_userId_idx" ON "password_reset_token"("userId");

-- Backfill: usuario inicial para filas existentes (primer nombre, minúsculas, sin acentos).
WITH nombres AS (
    SELECT
        id,
        lower(translate(substring(name FROM '^\S+'), 'áéíóúÁÉÍÓÚñÑüÜ', 'aeiouaeioununu')) AS base,
        substring(name FROM '^\S+') AS d
    FROM "user"
    WHERE username IS NULL AND name IS NOT NULL AND name <> ''
), numerados AS (
    SELECT
        id,
        base,
        d,
        row_number() OVER (PARTITION BY base ORDER BY id) AS rn,
        count(*) OVER (PARTITION BY base) AS n
    FROM nombres
)
UPDATE "user" u
SET username = CASE WHEN num.n = 1 THEN num.base ELSE num.base || '_' || num.rn END,
    "displayUsername" = num.d
FROM numerados num
WHERE u.id = num.id;

-- CreateIndex
CREATE UNIQUE INDEX "user_username_key" ON "user"("username");

-- CreateIndex
CREATE UNIQUE INDEX "user_documento_key" ON "user"("documento");

-- AddForeignKey
ALTER TABLE "password_reset_token" ADD CONSTRAINT "password_reset_token_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;