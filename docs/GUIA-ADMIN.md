# Guia de Uso — Plataforma "Padres Plus 50"

**Campeonato de Futbol del Colegio Sagrado Corazon de Jesus**

---

## 1. Que es esta plataforma

Es una aplicacion web que administra todo el campeonato de futbol "Padres Plus 50": desde el registro de equipos y jugadores, pasando por la programacion de partidos, hasta el control en vivo de cada partido y la publicacion de resultados.

**Direccion de acceso:** ingrese a la URL proporcionada por el coordinador del campeonato.

---

## 2. Roles y quién hace qué

La plataforma maneja cuatro niveles de acceso. Cada usuario ingresa con su **nombre de usuario** y **contraseña** asignados por un administrador.

### 2.1 Admin (Administrador)

Control total sobre la plataforma. Puede:

- Crear, editar y eliminar: canchas, equipos, jugadores, torneos, jornadas y partidos
- Crear usuarios y asignar cualquier rol
- Operar la mesa de control de partidos
- Generar cronicas con inteligencia artificial y aprobar su publicacion
- Gestionar amonestaciones y pagos
- Ver el historial completo de partidos

### 2.2 Supervisor

Mismo alcance que el admin, excepto:

- **No puede crear torneos** (si puede programar partidos dentro de torneos existentes)
- Al crear usuarios, solo puede asignar roles de **operador de mesa** o **delegado**

### 2.3 Operador de Mesa

Solo puede:

- **Operar partidos en vivo** desde la pestaña "Mesa"
- No ve montos de multas ni puede gestionar usuarios

### 2.4 Delegado

- Ingresa a `/acceso` igual que los demas
- Al iniciar sesion, ve su **planilla de amonestados** con los montos a pagar
- Solo tiene acceso de lectura

### 2.5 Publico (sin sesion)

Cualquier persona con la direccion puede ver:

- Calendario de partidos en tiempo real
- Tabla de posiciones y goleadores
- Jugadores amonestados
- Perfiles de equipos y jugadores

---

## 3. Acceso inicial: primer admin y supervisor

1. La plataforma se entrega con **un único usuario admin predeterminado**, creado por el desarrollador durante la instalación.
2. Ingrese al panel con ese admin e inicie la configuración.
3. Desde la pestaña **Crear Usuarios**, cree el usuario **supervisor** (el admin puede asignar cualquier rol).
4. El supervisor completa los accesos del resto del equipo: **operadores de mesa** y **delegados**.
5. Todas las credenciales se generan automáticamente y se muestran **una sola vez**.

> **Nota:** Las credenciales se generan con la siguiente logica:
> - **Usuario:** primer nombre en minusculas, sin acentos (ej: "pedro" o "pedro2" si ya existe otro Pedro)
> - **Contraseña:** primer nombre + ultimos 3 digitos de la cedula, rellenada con "50" hasta tener 8 caracteres

---

## 4. Panel administrativo: paso a paso

Al iniciar sesion como admin o supervisor, accede al panel administrativo con las siguientes pestañas:

---

### 4.1 CANCHAS

**Que hace:** Registra las canchas donde se jugaran los partidos.

**Pasos:**
1. Haga clic en "Nueva cancha"
2. Ingrese el nombre (obligatorio, debe ser unico), ubicacion (opcional) y descripcion (opcional)
3. Haga clic en "Guardar"
4. Para editar: haga clic en el icono de lapiz en la lista
5. Para eliminar: haga clic en el icono de basura y confirme
6. Puede activar/desactivar canchas con el interruptor verde/gris

> **Consejo:** Registre todas las canchas antes de programar partidos.

---

### 4.2 EQUIPOS / JUGADORES

**Que hace:** Administra los planteles de cada equipo. Permite importar jugadores desde Excel y ver la plantilla completa.

#### Importar desde Excel

1. Prepare un archivo Excel (.xlsx) con **una hoja por equipo**
2. El **nombre de la hoja** debe coincidir exactamente con el nombre del equipo registrado
3. Columnas requeridas:

| Columna | Obligatoria | Ejemplo |
|---------|------------|---------|
| Nombres | Si | Juan Carlos |
| Apellidos | Si | Perez Lopez |
| Cedula | No | 1234567890 |
| Fecha nacimiento | No | 15/03/1975 |
| Numero camiseta | No | 10 |

4. Haga clic en "Importar Excel" y seleccione el archivo
5. El sistema mostrara un resumen: jugadores nuevos, a actualizar, con errores
6. Si todo esta correcto, haga clic en "Confirmar importacion"

> **Importante:** La importacion reemplaza la plantilla completa del equipo. Los jugadores que NO estan en el Excel seran desactivados (no se borran, solo se marcan como inactivos).

#### Ver plantillas

Despues de importar, cada equipo aparece como un acordeon expandible. Al hacer clic se muestra la lista de jugadores con: numero de camiseta, nombre completo, cedula, fecha de nacimiento, edad y estado.

#### Exportar

Puede descargar la plantilla actual de todos los equipos en formato Excel desde el boton "Exportar".

---

### 4.3 PROGRAMACION

**Que hace:** Crea torneos, jornadas (fechas) y programa partidos.

#### Paso 1: Crear el torneo

1. Haga clic en "Nuevo torneo"
2. Ingrese nombre (ej: "Torneo Apertura 2026") y temporada (ej: "2026")
3. Haga clic en "Crear"
4. El torneo quedara en estado **Borrador**. Actívelo con el interruptor cuando este listo

> **Solo el admin** puede crear torneos. El supervisor puede programar dentro de torneos existentes.

#### Paso 2: Crear jornadas (fechas)

1. Seleccione el torneo
2. Haga clic en "Nueva jornada"
3. Ingrese nombre (ej: "Fecha 1") y la fecha del dia de juego
4. Haga clic en "Crear"

#### Paso 3: Programar partidos

**Programacion automatica (recomendada):**
1. Seleccione la jornada
2. Ingrese hora de inicio, duracion del partido, intervalo entre partidos y las canchas disponibles
3. Haga clic en "Programar automaticamente"
4. El sistema genera los partidos sin solapamientos ni cruces

**Programacion manual:**
1. Seleccione la jornada
2. Elija equipo local, equipo visitante, cancha y hora
3. Haga clic en "Agregar partido"
4. Puede editar o eliminar partidos individuales

#### Gestion de torneos

Desde "Lista de torneos" puede:

- Activar/desactivar torneos con el interruptor
- Editar nombre y temporada (solo admin)

---

### 4.4 MESA (Control de partidos en vivo)

**Que hace:** Es el corazon de la plataforma. Desde aqui se opera cada partido en tiempo real: alineaciones, goles, tarjetas, reloj y cierre del acta.

#### Acceso

- Los **operadores de mesa** ven SOLO esta pestaña
- Los **admins y supervisors** la ven junto con las demas pestañas

#### Flujo de un partido

**Paso 1: Seleccionar el partido**
1. En el desplegable, seleccione el partido que va a dirigir
2. Se cargan las plantillas de ambos equipos y las sanciones activas

**Paso 2: Ingresar datos del acta**
1. Complete los campos: Operador (nombre y apellido) y Arbitro (nombre y apellido)
2. Haga clic en "Guardar operador/arbitro"

**Paso 3: Seleccionar alineaciones**
1. Marque con el checkbox los jugadores que participaran en cada equipo
2. Los jugadores **sancionados** aparecen en rojo con el texto "Sancionado" y su checkbox esta **deshabilitado** — no pueden ser alineados

**Paso 4: Registrar eventos durante el partido**

Use el formulario en la parte inferior:

| Campo | Que seleccionar |
|-------|----------------|
| Jugador | El jugador que realiza la accion |
| Minuto | Minuto del juego (se incrementa automaticamente) |
| Tipo | Gol, Amarilla, Azul o Roja |
| Boton | "Anadir" |

- **Gol:** seleccione el jugador y el sistema registra automaticamente el equipo al que pertenece
- **Tarjeta:** seleccione el tipo (amarilla, azul o roja) y el jugador

> **Limite:** Maximo 3 tarjetas por jugador por partido.

**Paso 5: Control del reloj**

El reloj avanza automaticamente:

```
Primer tiempo:   00:00 a 39:59  (cronometro ascendente)
Entretiempo:     10:00 a 00:01  (cuenta regresiva)
Segundo tiempo:  40:00 a 79:59  (cronometro ascendente)
```

El boton **"Finalizar acta"** se habilita automaticamente cuando el reloj llega a **80:00** del segundo tiempo.

Si necesita forzar un cambio de fase (por ejemplo, reiniciar el reloj), use los controles "Fase manual":

1. Seleccione la fase deseada (Primer tiempo / Entretiempo / Segundo tiempo)
2. Ingrese el minuto de inicio
3. Haga clic en "Aplicar"
4. Para volver al reloj original, haga clic en "Restaurar programacion"

**Paso 6: Guardar avance**

Haga clic en "Guardar avance" para persistir los datos en la base de datos. Puede guardar multiples veces durante el partido.

**Paso 7: Finalizar**

1. cuando el reloj alcance 80:00, haga clic en "Finalizar acta"
2. El sistema guarda todo y **recalcula automaticamente**:
   - Tabla de posiciones
   - Goleadores del torneo
   - Estadisticas de fair play (puntos por tarjetas)
3. El partido quedara registrado como FINALIZADO

> **Advertencia:** Una vez finalizado el acta, no se pueden modificar los datos del partido.

#### Historial de partidos

Los admins y supervisors pueden acceder al historial desde un boton en la pestaña Mesa. Muestra todos los partidos finalizados agrupados por torneo y jornada, con los datos completos del acta.

---

### 4.5 CRONICAS

**Que hace:** Genera cronicas de los partidos con inteligencia artificial, permite revision humana y publica en redes sociales.

> **Nota:** La pestaña de cronicas esta oculta en el panel; su funcionalidad se mantiene internamente. Ninguna cronica se publica sin revision y aprobacion humana previa.

#### Flujo

1. Seleccione un partido finalizado de la lista lateral
2. Haga clic en "Generar con IA" — el sistema crea un borrador con titulo y texto
3. Revise y edite el titulo y el texto segun necesite
4. Marque la casilla "Aprobar contenido revisado"
5. Seleccione los canales de publicacion (X / Instagram)
6. Haga clic en "Publicar"

> **Control de calidad:** Ninguna cronica se publica sin aprobacion humana previa.

#### Estados de la cronica

| Estado | Significado |
|--------|------------|
| Borrador | Generada por IA, pendiente de revision |
| Aprobada | Revisada y aprobada por el administrador |
| Publicada | Enviada a las redes sociales |
| Error | Fallo en la publicacion (ver detalle) |

---

### 4.6 AMONESTADOS

**Que hace:** Agrupa las tarjetas de los partidos finalizados **por jugador y partido** y gestiona las multas y suspensiones.

Cada fila corresponde a **un jugador en un partido** (maximo 3 tarjetas por jugador y partido) y muestra: jugador, equipo, fecha, partido, las tarjetas, la combinacion de sancion y el valor a pagar (la multa es la suma de los valores de las tarjetas).

**Valores de multa por tarjeta:**

| Tarjeta | Valor |
|---------|-------|
| Amarilla | $15.000 |
| Azul | $25.000 |
| Roja | $40.000 |

**Combinaciones y sanciones:**

| Combinacion | Sancion |
|-------------|---------|
| 2 amarillas | 1 fecha |
| Azul | 2 fechas |
| Roja | 3 fechas |
| Amarilla + Azul | 2 fechas |
| Amarilla + Roja | 3 fechas |
| Azul + Roja | 5 fechas |
| Amarilla + Azul + Roja | Suspendido del torneo |

#### Vista "Pendientes"

Muestra las combinaciones que aun no han sido pagadas y las sanciones que siguen activas.

#### Marcar como pagado

1. Haga clic en el boton **"Pagar"** de la fila
2. Se registra el pago **y se activa la sancion** de la combinacion: la suspension arranca en el partido de la **jornada siguiente** a la del partido
3. La sancion queda **activa hasta cumplir las fechas**: al agotarse pasa al historico automaticamente
4. Las suspensiones **indefinidas** (suspendido del torneo) se pueden **revocar** con el boton "Revocar suspension"

#### Vista "Historico"

Muestra las combinaciones pagadas que ya **cumplieron sus fechas** y las **revocadas**.

> **Las tarjetas amarillas solo generan multa economica, NO generan suspension de partido. La sancion cuenta desde la jornada siguiente a la del partido.**

---

### 4.7 CREAR USUARIOS (Gestion de accesos)

**Que hace:** Crea cuentas de acceso para otros administradores, supervisores, operadores y delegados.

#### Crear un usuario

1. Ingrese: nombre completo, cedula, telefono y correo electronico
2. Seleccione el rol:
   - **Admin:** puede crear cualquier rol
   - **Supervisor:** solo puede asignar operador_de_mesa o delegado
3. Haga clic en "Crear"
4. El sistema muestra las credenciales generadas (usuario y contraseña)

> **Guarde las credenciales.** Solo se muestran una vez. Si se pierden, el usuario debera solicitar recuperacion de contraseña.

#### Recuperaciones pendientes

Si un usuario olvido su contraseña y solicita recuperacion por telefono, el codigo de 6 digitos aparece aqui para que el admin se lo proporcione.

---

### 4.8 USUARIOS / ROLES

**Que hace:** Muestra la lista de todos los usuarios del sistema con sus roles asignados.

- Es **solo lectura** — los roles no se pueden cambiar una vez creados
- Si un usuario necesita cambiar de rol, debe recrearse desde "Crear Usuarios"

---

## 5. Portal publico (campeonato)

Cualquier persona puede acceder al portal sin iniciar sesion.

### 5.1 Calendario (`/campeonato`)

- Muestra los partidos organizados por jornada (fecha)
- Los partidos en vivo muestran el **reloj en tiempo real** con un indicador pulsante
- Los goles aparecen con el minuto y nombre del autor
- Se actualiza automaticamente cada 10 segundos
- Puede cambiar de torneo con el selector en la parte superior

### 5.2 Posiciones / Goleadores (`/campeonato/posiciones`)

- **Tabla de posiciones:** ordenada por puntos, con goles a favor, en contra, diferencia de goles
- **Goleadores:** los 15 jugadores con mas goles en el torneo seleccionado
- Los nombres de equipos y jugadores son clickeables y llevan a sus perfiles

### 5.3 Amonestados (`/campeonato/amonestaciones`)

- Lista de jugadores que han recibido tarjetas en partidos finalizados
- Muestra: nombre, equipo, fecha, partido y tipo de tarjeta (con color)
- Excluye tarjetas ya pagadas

### 5.4 Perfil de equipo (`/equipos/[id]`)

- Color del equipo, plantilla de jugadores con numero de camiseta
- Estadisticas por torneo (puntos, ganados, empatados, perdidos)
- Ultimos 10 resultados como local

### 5.5 Perfil de jugador (`/jugadores/[id]`)

- Numero de camiseta, posicion, estadisticas acumuladas
- Historial por torneo (goles, amarillas, rojas)
- Historial disciplinario (sanciones)
- Ultimos 20 goles con minuto y partido

---

## 6. Cambio de contraseña

Cualquier usuario autenticado puede cambiar su contraseña:

1. Haga clic en "Cambiar clave" (icono de llave) en la barra superior
2. Ingrese su contraseña actual
3. Ingrese la nueva contraseña (minimo 8 caracteres)
4. Confirme la nueva contraseña
5. Haga clic en "Guardar"

---

## 7. Recuperacion de contraseña

Si un usuario olvido su contraseña:

1. En la pantalla de login, haga clic en "Olvidaste tu clave?"
2. Ingrese su telefono registrado
3. Haga clic en "Generar codigo"
4. El sistema mostrara: "Si el numero esta registrado, ya se genero un codigo. Solicitalo al administrador."
5. El admin puede ver los codigos pendientes en la pestaña "Crear Usuarios"
6. El admin le proporciona el codigo de 6 digitos al usuario
7. El usuario ingresa: telefono, codigo y nueva contraseña
8. La contraseña se restablece

---

## 8. Consejos importantes

1. **Registre todo antes de empezar:** canchas, equipos, jugadores y el torneo deben estar creados antes de programar partidos
2. **Importe jugadores con Excel:** es la forma mas rapida y segura de cargar los planteles
3. **Programe partidos con programacion automatica:** evita solapamientos y cruces automaticamente
4. **Guarde avances frecuentemente** en la mesa de control — los datos no se guardan solos
5. **Finalice el acta solo cuando el reloj llegue a 80:00** — esto garantiza que todos los eventos esten registrados
6. **Revise las cronicas antes de publicarlas** — la IA genera borradores que requieren supervision humana
7. **Los roles no se pueden cambiar** despues de creados — si necesita cambiar un rol, cree un nuevo usuario desde "Crear Usuarios"
8. **No comparta credenciales** — cada usuario debe tener su propia cuenta
