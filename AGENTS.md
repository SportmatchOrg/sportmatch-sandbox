# AGENTS.md — Sportmatch

Instrucciones compartidas para Claude Code, Codex, GitHub Copilot y cualquier otro asistente que trabaje en este repositorio. Antes de proponer o modificar archivos, contrastar estas reglas con el código y la configuración actuales.

## 1. Producto y alcance

Sportmatch es una aplicación web responsiva que conecta personas que quieren practicar deportes. El MVP incluye autenticación, perfiles, creación y descubrimiento de partidos, solicitudes para unirse y ratings.

Requerimientos funcionales de referencia:

| ID | Funcionalidad |
| --- | --- |
| RF-01 | Autenticación |
| RF-02 | Perfil de usuario |
| RF-03 | Creación de partidos |
| RF-04 | Descubrimiento mediante swipe y mapa |
| RF-05 | Solicitudes para unirse a partidos |
| RF-06 | Ratings y penalización por no-show |

Fuera del alcance del MVP: aplicación móvil nativa, pagos, chat en tiempo real, integración B2B con canchas, múltiples idiomas, torneos o ligas, pruebas de carga y pentesting.

## 2. Estructura real del repositorio

Este repositorio contiene dos aplicaciones independientes en la raíz:

```text
sportmatch/
├── front/                  # Next.js, puerto 3000
├── back/                   # NestJS, puerto 3001
│   ├── prisma/             # Schema, migraciones y seed
│   ├── prisma.config.ts    # Configuración de Prisma 7
│   └── src/
│       ├── generated/prisma/ # Cliente generado de Prisma
│       └── <resource>/     # module, controller, service y repository
├── docker-compose.yml      # PostgreSQL 18, puerto 5432
├── package.json            # Scripts raíz y Husky
└── .github/                # CI, automatizaciones e instrucciones de Copilot
```

Reglas de estructura:

- Usar únicamente `front/` y `back/`; no crear `frontend/`, `backend/`, `apps/` ni `packages/`.
- No aplicar la estructura de un monorepo anterior ni agregar Turbo, Yarn workspaces o npm workspaces.
- El `package.json` raíz coordina comandos de ambas aplicaciones y configura Husky; no convierte al repositorio en un workspace.
- Cada aplicación conserva su propio `package.json` y `package-lock.json`.

## 3. Stack obligatorio

| Área | Tecnología |
| --- | --- |
| Runtime | Node.js 24 (`.nvmrc`) |
| Frontend | Next.js 16 con App Router, React 19, TypeScript y Tailwind CSS 4 |
| Backend | NestJS 11 y TypeScript |
| ORM | Prisma 7 |
| Base de datos | PostgreSQL 18 |
| Autenticación | Firebase |
| Package manager | npm exclusivamente |

No usar `yarn`, `pnpm` ni generar lockfiles de otros package managers.

## 4. Instalación, ejecución y verificación

Desde la raíz:

```bash
nvm use
npm install
npm --prefix front ci
npm --prefix back ci
docker compose up -d db
```

Desarrollo:

```bash
npm --prefix front run dev
npm --prefix back run start:dev
```

Verificación completa antes de un push o una PR:

```bash
npm run verify
```

`npm run verify` ejecuta lint, el comando de tests actual y los builds de frontend y backend. No omitir errores; las advertencias existentes deben informarse y no mezclarse con cambios ajenos al ticket.

## 5. Arquitectura obligatoria del backend

Cada resource de negocio debe tener estas cuatro capas:

```text
back/src/<resource>/
├── <resource>.module.ts
├── <resource>.controller.ts
├── <resource>.service.ts
└── <resource>.repository.ts
```

Puede incluir un directorio `dto/` para validar entradas HTTP, pero no debe omitir ninguna de las cuatro capas ni reemplazarlas por una arquitectura distinta.

Responsabilidades:

- **module:** compone el resource; registra controller, service y repository, y exporta solo lo necesario.
- **controller:** define rutas HTTP, recibe y valida DTOs y delega al service. No contiene reglas de negocio ni accede a Prisma.
- **service:** implementa reglas de negocio, coordina operaciones y traduce fallos a excepciones de NestJS. No accede a `PrismaService` directamente.
- **repository:** es la única capa del resource que inyecta y utiliza `PrismaService`. Encapsula todas las consultas y escrituras de base de datos.

Flujo esperado:

```text
HTTP → controller → service → repository → PrismaService → PostgreSQL
```

Usar `back/src/users/` como referencia de la separación actual. Para generar un resource, usar `--no-spec` y agregar el repository que Nest no genere automáticamente:

```bash
cd back
npx nest generate resource <nombre> --no-spec
```

## 6. Tests

Por ahora el proyecto no crea tests nuevos:

- Usar siempre `--no-spec` al generar resources, controllers o services.
- No crear archivos `.spec.ts`.
- No agregar suites, mocks ni infraestructura de testing salvo que un ticket futuro lo solicite explícitamente.
- El script actual usa `jest --passWithNoTests`; conservarlo y ejecutarlo mediante `npm run verify`.

## 7. Prisma 7

Este proyecto usa las convenciones de Prisma 7. No copiar ejemplos de Prisma 6.

El generator real de `back/prisma/schema.prisma` es:

```prisma
generator client {
  provider     = "prisma-client"
  output       = "../src/generated/prisma"
  moduleFormat = "cjs"
}
```

Por lo tanto:

- `output` es obligatorio.
- El cliente se genera en `back/src/generated/prisma`.
- Desde archivos ubicados en `back/src/<resource>/`, importar tipos de Prisma desde `../generated/prisma/client`.
- `PrismaService` importa `PrismaClient` desde `../generated/prisma/client`.
- No importar `PrismaClient`, `Prisma` ni tipos generados desde `@prisma/client`.
- No editar manualmente `back/src/generated/prisma`; se regenera con Prisma.
- `PrismaClient` debe inicializarse con el driver adapter `@prisma/adapter-pg`, como hace `back/src/prisma/prisma.service.ts`.
- La URL del datasource y la configuración de migraciones y seed están en `back/prisma.config.ts`. La implementación del seed está en `back/prisma/seed.ts`.
- Después de cambiar el schema, generar el cliente antes de compilar el backend.

Comandos desde `back/`:

```bash
npm run db:generate
npm run db:migrate
npm run db:deploy
npm run db:seed
npm run db:studio
```

Todo cambio de schema debe acompañarse con una migración de Prisma. No modificar la base de datos manualmente.

## 8. Frontend

- La aplicación vive en `front/` y usa Next.js App Router bajo `front/src/app/`.
- Mantener componentes tipados y evitar `any` sin justificación.
- Reutilizar los componentes existentes en `front/src/components/` y las utilidades de Tailwind antes de crear alternativas.
- Las variables públicas de Firebase se validan mediante `front/src/lib/env.ts`; no hardcodear credenciales ni configuración por ambiente.
- Respetar también el `front/AGENTS.md` generado por Next.js para reglas específicas de esa versión.

## 9. Puertos y comunicación local

| Servicio | Puerto | URL local |
| --- | ---: | --- |
| Frontend | 3000 | `http://localhost:3000` |
| Backend | 3001 | `http://localhost:3001` |
| PostgreSQL | 5432 | `localhost:5432` |

El frontend consume la API REST del backend. El backend acepta por defecto `http://localhost:3000` como origen CORS.

## 10. Git y trazabilidad

- `main` es la rama de entrega y `dev` la rama de integración.
- Crear las ramas desde `dev` y abrir la PR hacia `dev`; no hacer push directo a `main` ni a `dev`.
- Los tickets se identifican como `SPO-###`.
- Ramas: `feature/SPO-###-descripcion`, `fix/SPO-###-descripcion` o `chore/SPO-###-descripcion`.
- Commits: `tipo(SPO-###): mensaje`, por ejemplo `feat(SPO-150): agregar resource de deportes`.
- Incluir el ID `SPO-###` en el título de la PR y mantener un solo objetivo por PR.
- No mezclar formateos, refactors o archivos locales sin relación con el ticket.

## 11. Calidad, seguridad y agentes de IA

- Validar inputs del backend con DTOs y `class-validator`.
- No exponer secretos, credenciales, tokens ni datos personales en código, logs o comentarios.
- Mantener los controllers sin lógica de negocio y evitar acceso a Prisma fuera de repositories.
- Citar evidencia concreta (`archivo:línea`, PR o ticket) al reportar problemas.
- Los asistentes interactivos pueden modificar archivos solo cuando una persona lo solicite y dentro del alcance pedido.
- Los agentes automáticos de `.github/workflows/` revisan, verifican y reportan; no deben escribir ni mergear código autónomamente.
- La decisión final y el merge siempre corresponden a una persona.
