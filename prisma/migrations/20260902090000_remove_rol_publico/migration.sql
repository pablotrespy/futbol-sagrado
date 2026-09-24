-- Eliminar rol 'publico' del enum UserRole y cambiar el default a 'admin'.
-- (Recrea el enum porque ALTER TYPE ... DROP VALUE no es compatible en este entorno)
ALTER TABLE "user" ALTER COLUMN role DROP DEFAULT;
CREATE TYPE "UserRole_new" AS ENUM ('admin', 'supervisor', 'operador_de_mesa', 'delegado');
ALTER TABLE "user" ALTER COLUMN role TYPE "UserRole_new" USING role::text::"UserRole_new";
DROP TYPE "UserRole";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
ALTER TABLE "user" ALTER COLUMN role SET DEFAULT 'admin'::"UserRole";
