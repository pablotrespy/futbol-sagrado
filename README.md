# Padres Plus 50

Web app para digitalizar la operación del Campeonato Padres Plus 50 del Colegio Sagrado Corazón de Jesús.

## Inicio local

1. Copia `.env.example` a `.env`, cambia `BETTER_AUTH_SECRET` y define `ADMIN_EMAIL`.
2. Inicia PostgreSQL: `docker compose up -d`.
3. Genera el cliente y migra: `npm run db:generate` y `npm run db:migrate -- --name fase_0_auth`.
4. Inicia la aplicación: `npm run dev`.

La base local se publica en el puerto `5433` para evitar conflictos con instalaciones existentes de PostgreSQL. Registra primero la cuenta cuyo correo coincide con `ADMIN_EMAIL`; esa cuenta recibirá el rol `admin` y podrá asignar los roles `mesa_de_control` y `publico` desde **Accesos**.

## Fase 1

- CRUD de canchas.
- CRUD de equipos y jugadores.
- Acceso por correo y contraseña con Better Auth.
- Protección RBAC en todas las operaciones y administración visual de roles.

## Fase 2

- Creación de torneos y jornadas.
- Programación automática round robin con múltiples canchas y franjas horarias.
- Programación manual de partidos.
- Validación de cruces de cancha, horario y equipos antes de persistir.
- Edición y eliminación exclusivamente de partidos no finalizados.

## Fase 3

- Actas en vivo con alineaciones, goles y tarjetas.
- Bloqueo de jugadores sancionados en cliente y servidor.
- Sanciones por número de fechas o indefinidas.
- Finalización irreversible de actas.
- Recálculo automático de posiciones, goleadores y fair play.

## Fase 4

- Generación de crónicas mediante un LLM usando únicamente el JSON del acta.
- Edición y aprobación humana obligatoria.
- Publicación mediante Axios en X e Instagram.
- Registro del resultado y error independiente por canal.

Para desarrollo, `.env` usa `CONTENT_MOCK_MODE="true"` y nunca publica externamente. Para producción, cambia el valor a `false` y configura `OPENAI_API_KEY`, `X_BEARER_TOKEN`, `INSTAGRAM_ACCESS_TOKEN`, `INSTAGRAM_USER_ID` e `INSTAGRAM_IMAGE_URL`. Instagram requiere una imagen pública para crear la publicación con su API oficial.

## Fase 5

- Portal público en `/campeonato` sin necesidad de autenticación.
- Calendario, resultados, posiciones, goleadores, fair play y sanciones vigentes.
- Perfiles públicos de jugadores con historial estadístico y disciplinario.
- Perfiles públicos de equipos con plantilla, campañas y resultados.
- DTOs server-only que excluyen documentos, correos y datos de autenticación.

## Fase 6

- Validaciones Zod compartidas entre formularios y endpoints.
- Suite Vitest para los seis flujos funcionales críticos.
- Matriz RBAC comprobable para `admin`, `mesa_de_control` y `publico`.
- Endpoints internos de catálogos, actas, sanciones y crónicas restringidos a roles operativos.
- Regla disciplinaria probada en los límites inicial y final de una sanción.

Ejecuta `npm test`, `npm run typecheck`, `npm run lint` y `npm run build` antes de publicar.

## Base técnica

Next.js App Router, TypeScript estricto, Better Auth, Prisma/PostgreSQL, Axios, Zustand, React Hook Form, Zod y Tailwind/shadcn-ui.

Los datos persistentes viven exclusivamente en PostgreSQL. Zustand queda reservado para estado efímero de UI y de la sesión del acta en vivo.
