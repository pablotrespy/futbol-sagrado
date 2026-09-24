-- Fase 1 / módulo 11: identidad de cuentas requerida por Better Auth 1.7.
ALTER TABLE "account" ADD COLUMN "issuer" TEXT NOT NULL;
CREATE UNIQUE INDEX "account_issuer_accountId_key" ON "account"("issuer", "accountId");
