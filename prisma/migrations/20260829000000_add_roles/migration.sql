-- Roles ampliados: supervisor, operador_de_mesa (renombrado) y delegado.
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'supervisor';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'delegado';
ALTER TYPE "UserRole" RENAME VALUE 'mesa_de_control' TO 'operador_de_mesa';
