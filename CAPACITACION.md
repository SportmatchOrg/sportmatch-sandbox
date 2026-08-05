# Capacitación SportMatch — 6 horas, 100% práctica

Objetivo: que cada dev, en **~6 h**, entienda para qué sirve cada tecnología del stack y **la use de verdad** sobre un repo que se parece a SportMatch — implementando una feature (uno front, otro back) y pasándola por el flujo **branch → commit → PR → merge** para ver a los **agentes de IA** en acción.

**Reparto del tiempo (por dev):**

| Bloque | Tiempo | Qué hace |
|--------|--------|----------|
| 1. Intro teórica corta | **1–1.5 h** | Ver 1 recurso por tecnología + leer "por qué lo elegimos" |
| 2. Levantar el repo con Docker | 0.5–1 h | Clonar el starter y `docker compose up` |
| 3. Implementar la feature | ~2 h | Un dev la de back, el otro la de front |
| 4. Branch + PR + ver los agentes | ~1 h | Abrir el PR y observar qué comentan los agentes; mergear |

---

## Bloque 1 — Intro teórica corta (1 recurso c/u + por qué lo elegimos)

Solo lo esencial: qué es, dónde lo van a usar en SportMatch y por qué está en el stack. **Un recurso por tecnología.**

### TypeScript
- **Recurso (5 min):** [TypeScript in 5 minutes (oficial)](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html)
- **Para qué:** JavaScript con tipos. Detecta errores al escribir, no en producción.
- **Dónde lo usan:** en TODO — front y back están en TypeScript.
- **Por qué lo elegimos:** un solo lenguaje para los dos servicios, menos bugs en runtime (ayuda a RNF-04 Resiliencia) y autocompletado que se potencia con Prisma y NestJS.

### Next.js (frontend)
- **Recurso (~2 min):** [Next.js in 100 Seconds — Fireship](https://www.youtube.com/watch?v=Sklc_fQBmcs)
- **Para qué:** framework de React para armar webs con routing, render y buen rendimiento.
- **Dónde lo usan:** toda la interfaz — pantallas de partidos, perfil, login (RF-01 a RF-04).
- **Por qué lo elegimos:** rapidísimo para construir una web responsiva (RNF-01), ecosistema enorme y deploy simple.

### NestJS (backend)
- **Recurso (~6 min):** [What NestJS actually is — no-fluff (DEV)](https://dev.to/ramkashyap2050/what-nestjs-actually-is-a-simple-no-fluff-explanation-3m9e) · alternativa oficial: [First steps](https://docs.nestjs.com/first-steps)
- **Para qué:** framework de Node en TypeScript para APIs, con estructura por módulos e inyección de dependencias.
- **Dónde lo usan:** la API REST que expone partidos, solicitudes, ratings (RF-03, RF-05, RF-06).
- **Por qué lo elegimos:** da estructura y "barandas" (módulos + validación con DTOs) en vez de un Express en blanco — ideal para un equipo que recién arranca y para un monolito modular.

### Docker
- **Recurso (~2 min):** [Docker in 100 Seconds — Fireship](https://www.youtube.com/watch?v=Gjnup-PuquQ)
- **Para qué:** empaqueta cada servicio (front, back, base de datos) en contenedores que corren igual en cualquier máquina.
- **Dónde lo usan:** `docker compose up` levanta todo el entorno local; y es la base del deploy en Azure.
- **Por qué lo elegimos:** mata el "en mi máquina anda", todos corren lo mismo con un comando, y se alinea con la infra (Azure).

> **Prisma + PostgreSQL** y **Tailwind** no llevan intro aparte: los tocan directo en la feature. Prisma = ORM tipado para hablar con Postgres (migraciones y queries con tipos); Tailwind = clases utilitarias para estilar rápido y responsive.

---

## Bloque 2 — Levantar el repo (con el stack, no vacío)

Se usa un **starter que ya combina el stack**, parecido a lo que van a construir:

- **Repo base:** [nest-next-prisma-monorepo-starter](https://github.com/AceTheNinja/nest-next-prisma-monorepo-starter) — Nest.js + Next.js + Prisma + Tailwind en un monorepo.

**Pasos:**
1. Un manager forkea el starter a un repo del equipo (ej. `sportmatch-playground`), instala el paquete de agentes (`.github/` — ver `README.md`), carga los secrets de test y crea 2 issues en un Linear de test (uno de back, uno de front).
2. Cada dev clona el repo.
3. `docker compose up` (o el comando que indique el README del starter) → confirmar que **front, back y Postgres** levantan y la app abre en el navegador.
4. Correr las migraciones/seed de Prisma si el starter lo pide.

> Meta de este bloque: que vean el entorno completo corriendo con **un comando**, y entiendan qué contenedor es cada cosa.

---

## Bloque 3 — La feature (uno back, uno front)

Cada dev toma **una** de estas. Son chicas, a propósito, y calcadas de una historia real de SportMatch.

### Dev A — Backend: endpoint de partidos (NestJS + Prisma + REST)
**Tarea:** exponer `GET /partidos` que devuelva partidos desde la base.
1. En el modelo de Prisma, agregá una entidad `Partido` (`id`, `deporte`, `fecha`, `cupo`) si no existe; corré una **migración** de Prisma.
2. Sembrá 2-3 partidos de ejemplo (seed).
3. Creá un **módulo NestJS** `partidos` (controller + service) con `GET /partidos` que use Prisma para devolver la lista.
4. (Opcional) agregá un DTO con validación para un `POST /partidos`.

**Criterio de aceptación:** `GET /partidos` responde un JSON con la lista (probado con `curl` o Swagger). Referencia: RF-03.

### Dev B — Frontend: pantalla de partidos (Next.js + Tailwind)
**Tarea:** una página `/partidos` que consuma la API y liste los partidos.
1. Creá la ruta `/partidos` (App Router).
2. Hacé fetch a `GET /partidos` del backend.
3. Renderizá cada partido como una **card con Tailwind**, responsive: 1 columna en mobile, grilla en desktop.
4. Mostrá un estado de "cargando" y uno de "sin partidos".

**Criterio de aceptación:** la página muestra la lista estilada y se ve bien en mobile y desktop (RNF-01). Referencia: RF-04.

> Si trabajan en paralelo, el Dev B puede arrancar con datos mock y conectar la API real cuando el Dev A tenga el endpoint.

---

## Bloque 4 — Branch → commit → PR → y ver a los agentes

Acá está el corazón de la capacitación: que **interactúen con git y vean el efecto de los agentes**.

**Pasos (cada dev con su feature):**
1. Crear la rama: `git checkout -b feature/RF-03-endpoint-partidos` (back) / `feature/RF-04-pantalla-partidos` (front).
2. Commitear con la convención del equipo: `feat(RF-03): endpoint GET /partidos`.
3. `git push` y **abrir un Pull Request** hacia `dev`.
4. **Observar a los agentes actuar sobre el PR** (esto es lo que van a vivir todo el proyecto):

| Agente | Qué van a ver |
|--------|----------------|
| **Code review de Copilot** | Comentarios en el diff: bugs, estilo, seguridad, según `AGENTS.md` y `copilot-instructions.md` |
| **Traductor a negocio** | Un comentario que explica el PR sin jerga: qué historia, riesgo, qué probar |
| **DoD checker** | El veredicto de Definition of Done (qué cumple y qué falta) |
| **Curador de contexto** | Si cambiaron el modelo de Prisma (estructura), puede abrir un issue proponiendo actualizar `AGENTS.md` |

5. Un compañero (o el manager) **revisa, aprueba y mergea** el PR → ven el ciclo completo cerrarse.
6. (Opcional, 10 min) provocar un conflicto simple entre las dos ramas y resolverlo, para practicar `merge`.

**Cierre (15 min):** mini-demo donde cada dev muestra su PR y qué le comentaron los agentes. Con eso quedan listos para el desarrollo real.

---

## Checklist del dev (para tildar)

- [ ] Vi los 4 intros y leí el "por qué lo elegimos"
- [ ] Levanté el repo con `docker compose up` y abrió en el navegador
- [ ] Implementé mi feature (front o back) y cumple el criterio de aceptación
- [ ] Creé mi rama, commiteé con la convención y abrí el PR
- [ ] Vi los comentarios de los agentes en mi PR
- [ ] Mi PR fue revisado y mergeado

---

## Notas
- Todo gratis. Para créditos de Azure (la infra), tramiten el **GitHub Student Pack**.
- Si un enlace de video/blog cambia, la **doc oficial** de cada tecnología es la fuente estable.
- El playground es descartable: el aprendizaje y el hábito de trabajar con agentes es lo que queda.
