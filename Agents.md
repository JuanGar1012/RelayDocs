# AGENTS.md

# RelayDocs

## Context management (checkpointing)
- If you (the agent) detect the context window is at or above ~70% usage OR the user mentions context is high, you MUST create a checkpoint before continuing.
- A checkpoint consists of writing/overwriting these files in the repo root:

  1) `PROJECT_STATE.md` (always overwrite)
     - Canonical current state (goal, architecture, key files, completed work, open tasks, decisions, constraints)
     - Must be concise and structured
     - No full code blocks

  2) `CHECKPOINTS/PROJECT_STATE_<YYYY-MM-DD_HHMM>.md` (new file each time)
     - Snapshot copy of PROJECT_STATE.md content

  3) `DECISIONS.md` (append-only)
     - Add a dated entry for any material design decisions or tradeoffs since the last checkpoint

- The checkpoint must include:
  - Goal + non-goals
  - Current architecture and data model
  - Key commands (dev/test/lint/build)
  - Files created/modified and why (high level)
  - Completed items
  - Open tasks (prioritized)
  - Known issues / edge cases
  - “Next 3 actions” checklist

- After checkpointing, continue work using PROJECT_STATE.md as the canonical source of truth and do NOT rely on earlier chat history.


## Project mission

RelayDocs is a production-style, portfolio-ready collaborative document management platform designed to demonstrate:

- React + TypeScript + Tailwind frontend engineering
- Service-oriented backend architecture
- Java Spring Boot microservices (Spring MVC)
- Node.js API Gateway (REST aggregation layer)
- SQL + PostgreSQL database design
- JPA/Hibernate ORM usage
- Kafka-based event-driven architecture
- RBAC and secure API design
- Git-based collaborative workflow

This project must reflect real-world engineering standards suitable for senior-level technical interviews.

Non-negotiables:
- Deterministic behavior
- TypeScript strict mode enabled
- No `any`
- Validation at API boundaries
- Server-enforced authorization
- No secrets in code or logs
- Small, focused diffs only
- No sweeping refactors unless requested

---

## Tech stack

### Frontend
- React
- TypeScript (strict)
- Vite
- Tailwind CSS
- Bootstrap (select components allowed)
- TanStack Query
- React Router

### API Gateway
- Node.js + TypeScript
- Zod validation
- JWT authentication
- RESTful APIs

### Microservice
- Java 17+
- Spring Boot
- Spring MVC
- Spring Data JPA (Hibernate)
- Bean Validation

### Database
- PostgreSQL
- SQL schema scripts
- PL/pgSQL functions
- Indexed join tables for RBAC

### Event-Driven Architecture
- Kafka-compatible broker (Redpanda via Docker)
- Domain events:
  - document.created
  - document.updated
  - document.shared
  - permission.changed
- Idempotent consumers

### Testing
- Frontend: Vitest + React Testing Library
- Node: Vitest + integration tests
- Spring Boot: JUnit + Spring Boot Test
- E2E: Playwright

### Tooling
- npm
- Maven or Gradle (Spring service)
- ESLint
- Prettier
- Docker

---

## Quick start

Tooling requirements:
- Node >= 20
- npm (bundled with Node)
- Java >= 17
- Docker running

Package manager default:
- Use `npm` unless a task explicitly requires `pnpm`.
