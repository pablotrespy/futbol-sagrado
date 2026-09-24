<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Reglas de negocio — "Padres Plus 50" (Campeonato Sagrado Corazón de Jesús)

## Contexto
Aplicación web para el torneo de fútbol "Padres Plus 50". Maneja campeonato público (calendario, posiciones, goleadores, amonestados), y panel de administración (canchas, equipos/jugadores, programación, mesa de control, crónicas, amonestaciones, accesos).
- Stack: Next.js 16, React 19, zod, Prisma (prisma-client, `/src/generated/prisma`), axios, better-auth, zustand, vitest, xlsx (SheetJS).
- BD: docker `padres-plus-50-db`, db `padres_plus_50`, usuario `padres_app`, puerto 5433.
- Prisma: tras cambiar `prisma/schema.prisma`, ejecutar `npx prisma generate` (cliente en `src/generated/prisma`)
- SQL vía archivos temporales: `Get-Content -Raw <file> | docker compose exec -T postgres psql -U padres_app -d padres_plus_50`

## Workflow de sanciones (mesa de control)
- La mesa registra tarjetas durante el partido: **amarilla / azul / roja**. Máximo **2 tarjetas por jugador por partido**.
- Solo se generan las tarjetas (registros `Tarjeta`) desde partidos **FINALIZADO**.
- **Tarjeta amarilla** = solo multa económica, **no genera suspensión de partido**.
- El admin (pestaña "Amonestados") registra el pago por jugador+partido (botón «Pagar») y crea la sanción combinada desde las tarjetas visibles.
- Reglamento por combinación (multa = suma de tarjetas: AM $15.000, AZ $25.000, RO $40.000): 2 AM → 1 fecha; AZ → 2 fechas; RO → 3 fechas; AM+AZ → 2 fechas; AM+RO → 3 fechas; AZ+RO → 5 fechas; AM+AZ+RO → suspensión del torneo (indefinida). Regla pura en `src/lib/reglamento.ts` (máximo 3 tarjetas por jugador por partido).
- La sanción cuenta desde la **jornada siguiente** (`jornadaInicioNumero = ofensas + 1`); queda activa mientras cumple fechas (calculado en lectura con `isSanctionActiveAt`) y al agotarse pasa al histórico; las indefinidas se pueden **revocar** (PATCH `estado: "REVOCADA"`).
- `Sancion` tiene `partidoId` opcional (relación con el partido donde ocurrió la ofensa); `duracionFechas: 0` = sin suspensión (ojo: en `discipline.ts` `null` = activa indefinidamente).
- Los jugadores con sanción activa aparecen marcados ("Sancionado") y no pueden alinearse (checkbox deshabilitado) en la mesa.

## Motivo / sanción
- El campo `motivo` de una sanción es **opcional**: `z.string().trim().max(300).optional().default("")`. No requerir mínimo ni hacerlo obligatorio.

## Acta (operador / árbitro)
- Cada acta incluye **Operador** y **Árbitro** (nombre y apellido por separado, 4 campos).
- Estos se capturan en la mesa de control al seleccionar un partido y se guardan al Acta vía `POST /api/partidos/[id]/acta`.

## Mesas de control / reloj
- El reloj de partido avanza automático; el cronómetro del segundo tiempo llega a `MINUTO_FINALIZACION = 80`.
- El botón "Finalizar" solo se habilita cuando el cronómetro llega a **80:00** del segundo tiempo (función `puedeFinalizarActa`).
- La mesa permite forzar cambio de estado (primer tiempo / entretiempo / segundo tiempo) y restaurar la programación original.
- Las estadísticas (tabla de posiciones, goleadores, fair play) se calculan a partir de actas finalizadas.

## Goleadores
- La tabla de posiciones filtra goleadores con `goles: { gt: 0 }` — solo aparecen jugadores con goles anotados.

## Importación de jugadores (Excel)
- Se usa **xlsx** (SheetJS 0.18.5).
- Date serial de Excel: la función `fechaExcel()` convierte números seriales → formato ISO `YYYY-MM-DD`.
- El encabezado "Cedula" se resuelve por alias: `["documento", "cédula", "cedula", ...]`.

## Cambios de equipos (regla permanente)
Aplica a **todos los torneos, presentes y futuros** (política a largo plazo, 1-2 años):
- **Nunca se eliminan equipos.** El borrado queda solo para errores de carga y siempre verificando que el equipo no tenga jugadores, partidos ni actas.
- **Todo cambio de identidad se hace RENOMBRANDO** el equipo en BD (`UPDATE "Equipo" SET nombre='…'`): conserva historial, plantel, estadísticas y programación porque todo referencia `equipoId`. Luego se re-importa el plantel por el panel con la hoja de Excel nombrada igual al nombre nuevo.
- **Equipo que se retira sin reemplazo**: se **deja como está** (nombre y datos conservados; simplemente deja de programarse). Si años después se necesita el nombre, se renombra primero el histórico.
- **Equipos nuevos**: se crean por la tarjeta "Importar equipos desde Excel" en la pestaña "Equipos / Jugadores" (o por petición explícita vía SQL).
- Los renombres los ejecuta el asistente en BD; los importes de plantillas/equipos los hace el admin por el panel.

## Panel de administración
- Pestañas (en orden): Canchas, Equipos / Jugadores, Programación, Mesa, **Amonestados**, **Crear Usuarios** (admin y supervisor; el operador de mesa ve solo "Mesa"). La pestaña **Crónicas está oculta** (funcionalidad interna intacta: APIs y publicación).
- El enlace del header público "Panel" se llama **"Delegados"** y lleva a `/acceso`; el delegado aterriza en `/delegados/planilla`.
- La pestaña "Equipos" está oculta (equipos se crean vía "Importar equipos desde Excel" en "Equipos / Jugadores"; no hay edición/eliminación por panel — ver regla "Cambios de equipos").
- "Amonestados" (no "Disciplina") muestra las tarjetas de partidos finalizados **agrupadas por jugador y partido** (máximo 3 por jugador/partido, combinación con multa y sanción). «Pagar» crea una sola `Sancion` (PAGADA) con `jornadaInicioNumero = jornada + 1` y `partidoId`; quedan activas hasta cumplir fechas (el flag se calcula en lectura) y las indefinidas se revocan. Delegados ven la planilla en modo read-only (`ver_planilla_montos`).
- API de amonestaciones: `GET /api/amonestaciones` devuelve las combinaciones de partidos finalizados con jugador/equipo/jornada/torneoId/inicio y flags `pagada|activa|cumplida|revocada` (`activa` vía `isSanctionActiveAt` contra la ronda siguiente = máxima jornada finalizada + 1).

## Accesos / alta de usuarios
- **Registro público deshabilitado** (`emailAndPassword.disableSignUp: true`); todos los usuarios nacen de la pestaña **"Crear Usuarios"** (admin/supervisor). Login por **nombre de usuario** (plugin `username` de better-auth): `signIn.username(...)`; el correo queda como dato de contacto.
- Alta en `POST /api/usuarios` (exige `gestionar_roles` + `canAssignRole`). **Bootstrap**: si la tabla de usuarios está vacía, el primer alta se acepta sin sesión y debe ser rol `admin`.
- **El rol se asigna solo al crear el acceso** (tarjeta "Crear nuevo acceso" de "Crear Usuarios") y **no se puede modificar después**: el listado "Usuarios/Roles" (a la derecha de la misma pestaña) muestra el rol como **texto fijo** (sin desplegable) y **no existe** endpoint de cambio de rol (`PUT /api/usuarios/[id]` fue eliminado). Si hubiera que cambiar un rol, se recrea el acceso en "Crear Usuarios".
- **Solo el torneo del delegado se puede editar** vía `PATCH /api/usuarios/[id]` (exclusivo admin/supervisor, `gestionar_roles` + `canAssignRole`): cambia únicamente `torneoId` de un usuario con rol `delegado` (acepta `null` para desasignar). En "Usuarios/Roles", el delegado muestra un desplegable "Campeonato a verificar". El rol jamás se modifica aquí.
- Credenciales generadas (se muestran una sola vez): **usuario** = primer nombre normalizado (minúsculas, sin acentos, `[a-z0-9_]`, sufijo numérico si se repite); **clave** = `primerNombre + últimos 3 dígitos del documento`, alargada con `50` hasta ≥ 8 caracteres. Lógica en `src/lib/usuarios.ts`.
- Campos `User`: `username` (único), `displayUsername`, `documento` (único) y `telefono` — declarados como `additionalFields` (`input: false`) en `src/lib/auth.ts`; sin ellos better-auth descarta los campos al crear.
- **Recuperación por teléfono (mock)**: `POST /api/recovery/request` (siempre responde `ok`, anti-enumeración) genera código de 6 dígitos en `PasswordResetToken` (expira en 15 min, un solo uso); `GET /api/recovery/pending` lo muestra **solo a admin/supervisor** (`gestionar_roles`) en la sección colapsable "Recuperaciones pendientes" (botón bajo el formulario, dentro de "Crear Usuarios"); `POST /api/recovery/confirm` valida y actualiza la clave vía `internalAdapter.updatePassword`.
- **Cambio de clave autoservicio**: componente `CambiarClave` (usa `authClient.changePassword`) en el header del admin y en la planilla de delegados.
- Crucial: las 12 migraciones están **baselineadas** como aplicadas (`migrate resolve --applied`); `npm run dev` corre `prisma migrate dev` y queda "Already in sync". `prisma.config.ts` declara `datasource.shadowDatabaseUrl` → BD `padres_plus_50_shadow` para diff sin TTY.

## Páginas públicas (campeonato)
- Rutas bajo `/campeonato/*`, con layout que provee `PublicHeader` fijo + SubNav.
- SubNav pills: [Calendario] [Posiciones / Goleadores] [Amonestados]. Activa: `bg-red-100 text-red-700 font-bold`.
- `GET /api/amonestaciones` y `getPublicAmonestaciones()` alimentan la página pública de amonestaciones (muestra Fecha, no Jornada).

## Convenciones / pruebas
- Existen pruebas vitest en `tests/` (reloj 12, importar 5, importar-jugadores 7, phase6 7, usuarios 6).
- Verificar con `npm run typecheck` y `npm run lint`; ambos deben quedar limpios.

## Logo
- El logo actual es provisional (`public/logo-colegio.jpg`, 200×200). El usuario proveerá la imagen definitiva.

---

# Referencia Técnica del Proyecto — Padres Plus 50

## Descripción General
Aplicación web full-stack para gestionar el Campeonato de Fútbol "Padres Plus 50" del Colegio Sagrado Corazón de Jesús. Incluye panel administrativo protegido y portal público de consulta.

## Stack Tecnológico
- **Framework:** Next.js 16.3.1 (App Router)
- **UI:** React 19.2.8 + Tailwind CSS v4 + shadcn/ui (new-york)
- **Base de datos:** PostgreSQL 17 (Docker, puerto 5433)
- **ORM:** Prisma 7 (`@prisma/adapter-pg`)
- **Auth:** Better Auth (email+password)
- **Validación:** Zod v4 (compartido client/server)
- **Estado UI:** Zustand (solo acta en vivo)
- **Testing:** Vitest 4.1.11
- **IA:** OpenAI gpt-5-mini (crónicas)
- **Social:** X API v2 + Instagram Graph API v23.0

## Estructura de Carpetas
```
web-app/
├── prisma/           # Schema, config, 12 migraciones
├── src/
│   ├── app/          # Next.js App Router (rutas)
│   │   ├── acceso/   # Login por usuario (registro público deshabilitado)
│   │   ├── admin/    # Panel administrativo (protegido)
│   │   ├── campeonato/ # Portal público
│   │   ├── equipos/[id]/ # Perfil equipo
│   │   ├── jugadores/[id]/ # Perfil jugador
│   │   └── api/      # ~25+ route handlers REST
│   ├── components/
│   │   ├── ui/       # shadcn/ui base
│   │   ├── admin/    # 8 managers CRUD
│   │   └── public/   # Header público
│   ├── data/         # DTOs server-only
│   ├── lib/          # Lógica de negocio
│   ├── schemas/      # Zod schemas compartidos
│   ├── stores/       # Zustand (acta en vivo)
│   └── generated/prisma/ # Cliente Prisma generado
└── tests/            # Vitest tests
```

## Rutas Principales
| Ruta | Descripción | Auth |
|------|-------------|------|
| `/` | Landing page | No |
| `/campeonato` | Portal: calendario, posiciones, goleadores | No |
| `/equipos/[id]` | Perfil equipo | No |
| `/jugadores/[id]` | Perfil jugador | No |
| `/acceso` | Login por nombre de usuario (registro público deshabilitado; incluye recuperación de clave) | No |
| `/admin` | Panel administrativo | Sí (admin/supervisor/operador_de_mesa) |
| `/delegados/planilla` | Planilla de amonestados con montos | Sí (delegado) |

## Modelos de BD (20 tablas)
**Auth:** User, Session, Account, Verification, PasswordResetToken
**Catálogos:** Cancha, Equipo, Jugador
**Competición:** Torneo, Jornada, Partido
**Motor:** Acta, Alineacion, Gol, Tarjeta, Sancion
**Estadísticas:** ClasificacionEquipo, EstadisticaJugador
**Contenido:** Cronica, Publicacion

## API Endpoints Clave
- `/api/auth/[...all]` - Better Auth
- `/api/canchas`, `/api/equipos`, `/api/jugadores` - CRUD
- `/api/torneos`, `/api/fechas` - Competición
- `/api/partidos/[id]/acta` - Acta en vivo
- `/api/partidos/[id]/cronica/generar` - IA
- `/api/partidos/[id]/cronica/publicar` - Redes sociales
- `/api/sanciones` - Disciplina
- `/api/amonestaciones` - Tarjetas de partidos finalizados
- `/api/usuarios` - Alta de accesos (credenciales) + GET con permisos `gestionar_roles`
- `/api/recovery/request|pending|confirm` - Recuperación de clave por teléfono (mock)
- `/api/torneo/tabla-posiciones` - Clasificación (goleadores `goles: { gt: 0 }`)

## Roles (RBAC)
- `admin` - Control total (crea torneos, asigna cualquier rol, cobra amonestaciones)
- `supervisor` - Todo salvo crear/editar torneos; crea usuarios y asigna roles solo a operador/delegado; publica crónicas a redes
- `operador_de_mesa` - Solo pestaña "Mesa" + consulta del campeonato; NO ve montos a pagar
- `delegado` - Login propio; planilla de amonestados con montos (solo lectura, todos los equipos)
- `publico` - Solo consulta

Permisos finos en `src/lib/access-policy.ts`: `crear_torneo`, `gestionar_roles`, `gestionar_catalogos`, `programar`, `operar_mesa`, `gestionar_cronicas`, `publicar_redes`, `gestionar_amonestaciones`, `ver_planilla_montos`, `consultar`. `canAssignRole` limita el alcance de asignación por rol gestor.

## Scripts Disponibles
```bash
npm run dev          # Next.js dev
npm run build        # Build producción
npm run lint         # ESLint
npm run typecheck    # TypeScript check
npm run test         # Vitest
npm run db:generate  # Prisma generate
npm run db:migrate   # Prisma migrate
npm run db:studio    # Prisma Studio
```

## Variables de Entorno (12)
Ver `.env.example` para lista completa. Incluye DATABASE_URL, BETTER_AUTH_SECRET, OPENAI_API_KEY, X_API_*, INSTAGRAM_*, ADMIN_EMAIL, CONTENT_MOCK_MODE.

## Patrones de Diseño
- Validación Zod compartida client/server
- RBAC puro en `access-policy.ts`
- Round robin en `programacion.ts`
- Zustand solo para acta en vivo efímera
- DTOs server-only para portal público
- Mock mode para desarrollo sin APIs externas
- Transacciones Prisma para operaciones atómicas

