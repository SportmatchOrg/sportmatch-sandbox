# AGENTS.md — SportMatch

> Contexto compartido del proyecto para humanos y agentes de IA.
> Este archivo es la **fuente de verdad** que todos los agentes leen antes de trabajar.
> Mantenerlo actualizado: el agente `context-curator` audita este archivo en cada cambio estructural del repo.
>
> **Cómo completarlo:** las secciones marcadas con `<!-- TODO -->` deben llenarse una vez definido el stack (WBS 3.1.1). Todo lo demás ya está fijado por el Project Charter.

---

## 1. Qué es SportMatch

Plataforma web responsiva que conecta personas que quieren practicar deportes, eliminando la dependencia de grupos de WhatsApp y contactos previos. Es **generalista** (todos los deportes) y usa **ratings** para mejorar el matchmaking.

**Objetivo MVP (primeros 3 meses post-lanzamiento):**
- Team Completion Rate ≥ 70%
- ≥ 2 partidos por usuario por mes
- No-Show Rate ≤ 15%

**Fuera de alcance (NO implementar):** app móvil nativa, pagos/transacciones, chat en tiempo real, integración B2B con canchas, multi-idioma, torneos/ligas, pruebas de carga, pen-testing, mantenimiento post-MVP.

---

## 2. Requerimientos funcionales (usar estos IDs en commits, PRs y tickets)

| ID | Nombre | Prioridad | Criterios de aceptación (resumen) |
|----|--------|-----------|-----------------------------------|
| RF-01 | Autenticación | Must | Registro email+password, login, error ante credenciales inválidas, acceso autenticado |
| RF-02 | Perfil de usuario | Must | Ver perfil (datos, deportes, rating, historial), editar info básica |
| RF-03 | Creación de partido | Must | Crear paso a paso (deporte, fecha, ubicación, cupo), validación de campos, queda visible |
| RF-04 | Descubrimiento (swipe + mapa) | Should | Ver partidos disponibles, navegar por swipe o mapa, cercanía por ubicación |
| RF-05 | Sistema de solicitudes | Must | Solicitar unirse, organizador acepta/rechaza, estado visible, no exceder cupo |
| RF-06 | Sistema de rating | Should | Calificación post-partido (1–5★), refleja en perfil, penalización automática por no-show |

**No funcionales:** RNF-01 Responsividad · RNF-02 Usabilidad · RNF-03 Privacidad · RNF-04 Resiliencia · RNF-05 Mantenibilidad.

---

## 3. Modelo de datos (entidades principales)

Usuarios, Perfiles, Partidos, Solicitudes, Ratings, Historial.

Reglas de negocio clave: cupos, aprobación manual de solicitudes por el organizador, rating híbrido (calificación post-partido + penalización por no-show), edición de partidos, visibilidad de información.

<!-- TODO: pegar el diagrama Entidad-Relación (WBS 2.3.1) o link al mismo -->

---

## 4. Stack tecnológico

<!-- TODO (WBS 3.1.1): completar una vez elegido el stack -->

| Capa | Tecnología | Notas |
|------|-----------|-------|
| Frontend | _por definir_ | |
| Backend | _por definir_ | |
| Base de datos | _por definir_ | |
| Hosting / Deploy | _por definir_ | tier gratuito o créditos académicos |
| Mapa / Geolocalización | Google Maps API | RF-04 |
| CI | GitHub Actions | build + lint + typecheck (WBS 3.2.3) |

---

## 5. Estructura del repositorio

<!-- TODO: actualizar cuando se cree el scaffold (WBS 3.2.1). El context-curator mantiene esta sección. -->

```
/            (por definir según stack)
/.claude/agents/   Subagentes de IA (ver README)
/.github/workflows/  CI + agentes automatizados
/docs/       Documentación técnica y ADRs
```

---

## 6. Convenciones

**Git / branches**
- `main` = producción/entrega. `dev` = integración.
- Ramas de trabajo: `feature/RF-01-descripcion`, `fix/descripcion`, `chore/descripcion`.
- Un PR por historia/tarea. El título del PR referencia el ID: `RF-03: creación de partido paso a paso`.

**Commits**
- Convención: `tipo(RF-xx): mensaje` — ej. `feat(RF-03): validar campos obligatorios`.
- Tipos: `feat`, `fix`, `chore`, `docs`, `test`, `refactor`.

**Definition of Done** (verificada por el agente `dod-checker`)
- PR mergeada a `dev`
- Tests verdes en CI (build, lint, typecheck)
- Documentación actualizada si aplica
- Deploy a staging exitoso
- Todos los criterios de aceptación del RF cumplidos

**Naming / estilo de código**
<!-- TODO: definir según stack (linter, formatter, convención de nombres) -->

---

## 7. Herramientas y gestión

- **Issue tracker:** Linear. Cada tarea es un issue con su RF asociado y estimación en story points.
- **Diseño:** Figma (UX/UI previo al front, RP-06).
- **Repo:** GitHub.
- **Comunicación / notificaciones de agentes:** Discord.
- **Metodología:** ágil, 3 sprints de 1 mes. Reuniones de seguimiento quincenales + sprint reviews.

---

## 8. Reglas para agentes de IA (leer siempre)

1. **Lab4 no codifica.** Los agentes **revisan, verifican y reportan**; no escriben ni mergean código de forma autónoma. La decisión final es siempre humana.
2. **Humano en el loop.** Cuando un agente detecta algo accionable, su salida es una de estas dos: (a) **agregar una tarjeta al backlog de Linear** con la propuesta, o (b) **dejar un comentario/sugerencia en el PR**. Nunca ejecuta cambios sin aprobación.
3. **Citar evidencia.** Todo hallazgo se reporta con la referencia concreta (archivo:línea, ID del PR, ID del ticket).
4. **Alcance.** No proponer trabajo que caiga en "Fuera de alcance" (sección 1).
5. **Trazabilidad.** Relacionar siempre el trabajo con su RF-xx correspondiente.

---

## 9. Equipo

- **Dirección de proyecto (Lab 4):** Ignacio Chevallier Boutell, Tomás Valle Durán, Santos Bogo, Matías Chialva.
- **Desarrollo (Lab 2):** 2 desarrolladores, ~6 h/semana c/u. Roles rotan mensualmente.
