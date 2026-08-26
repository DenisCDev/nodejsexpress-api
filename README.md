<h1 align="center">RPG Character API</h1>

<p align="center">
  <b>An RPG character API with authentication, validation, tests and Docker</b>
</p>

<p align="center">
  <a href="https://github.com/DenisCDev/nodejsexpress-api/actions/workflows/ci.yml"><img src="https://github.com/DenisCDev/nodejsexpress-api/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/node-22%20LTS-43A48E?labelColor=171310" alt="Node 22 LTS"></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/typescript-strict-43A48E?labelColor=171310" alt="TypeScript strict"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-D4A24E?labelColor=171310" alt="MIT license"></a>
</p>

<p align="center">
  <img src="assets/mtg-banquet-guests.jpg" width="640" alt="Hobbits raising tankards at a banquet, bread and bunting — art by Viko Menezes, Tales of Middle-earth Commander (2023)">
</p>

<p align="center">
  <sub><i>"food and cheer and song"</i><br>
  — <b>The Hobbit</b>, chapter XIX · art by Viko Menezes for Magic: The Gathering, Tales of Middle-earth Commander (2023)
</p>

> **[Leia em Português](#portugues)**

This REST API manages RPG characters for authenticated users. Every record is
scoped to its owner, incoming data is validated before it reaches the business
logic, and credentials are removed from structured logs. The repository also
includes integration tests, a multi-stage Docker image and continuous
integration checks.

---

## Highlights

- **TypeScript strict** with `noUncheckedIndexedAccess` and no use of `any`
- **Express 5** with native async error propagation (no wrapper)
- **Zod-validated boundaries** for request bodies, route parameters and query strings
- **JWT auth** HS256 with explicit `iss`/`aud`, bcryptjs (12 rounds), per-route auth rate limit (10 req / 15 min)
- **Owner-scoped data** — get/patch/delete of someone else's id returns 404 (tested)
- **Structured logging** with Pino; `Authorization` and `Cookie` redacted
- **Hardened HTTP** — Helmet, CORS, 100kb body cap, global + auth rate limits, `x-powered-by` off
- **Deadlines** — Mongo connect/query timeouts, HTTP `requestTimeout`, bounded graceful shutdown
- **Liveness vs readiness** — `GET /health` is the process; `GET /ready` pings Mongo
- **Layered architecture** — `routes → controllers → services → models` with explicit error types
- **Tests** — Vitest + Supertest + `mongodb-memory-server`, no mocks against the DB
- **Multi-stage Docker** running as non-root `app` user; healthcheck hits `/ready`
- **GitHub Actions CI** — typecheck, lint, build, test on every push

---

## Stack

| Layer | Choice |
|-------|--------|
| Runtime | Node 22 LTS |
| Language | TypeScript 5.7 (strict + `noUncheckedIndexedAccess`) |
| HTTP | Express 5 |
| ODM | Mongoose 8 |
| Validation | Zod 3 |
| Auth | jsonwebtoken + bcryptjs |
| Logging | Pino + pino-http |
| Tests | Vitest + Supertest + mongodb-memory-server |
| Container | Docker (multi-stage, non-root) |
| CI | GitHub Actions |

---

## Architecture

```
src/
├── config/           env (zod), logger (redact), db (timeouts + ping)
├── lib/              typed AppError
├── middlewares/      auth (JWT), validate (Zod), error (centralized)
├── domain/
│   ├── auth/         user model, schemas, service, controller, routes
│   └── characters/   character model, schemas, service, controller, routes
├── app.ts            Express app factory (testable); /health + /ready
└── server.ts         bootstrap + bounded graceful shutdown
```

**Boundary discipline:** every input is parsed by Zod before reaching a service. Services throw typed `AppError` instances; the global error middleware translates them to HTTP responses. Nothing else throws to the network.

---

## Quick start

### Prerequisites
- Node 22+
- MongoDB running locally, or Docker

### Local

```bash
git clone https://github.com/DenisCDev/nodejsexpress-api.git
cd nodejsexpress-api
cp .env.example .env
# edit .env: set MONGODB_URI and a JWT_SECRET of 32+ characters (the placeholder will not boot)
npm install
npm run dev
```

API listening on `http://localhost:3000`.

### Docker

```bash
cp -n .env.example .env
# set JWT_SECRET in .env to a random value with at least 32 characters
# keep the same file if you already configured the local setup
docker compose up --build
```

### Tests

```bash
npm test                # one-shot
npm run test:watch      # watch mode
npm run test:coverage   # with coverage report
```

Tests boot a real Mongo via `mongodb-memory-server` — no mocks, no fixtures, full request/response cycles. Files run sequentially so they don't share-wipe the in-memory DB.

---

## API

All `/characters` endpoints require `Authorization: Bearer <token>`.

Domain field names (`nome`, `classe`, `raca`, …) follow D&D 5e in Portuguese — that is the product language, not the database convention of the rest of the codebase.

### Auth

| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | `/auth/register` | `{ email, password, name }` | `201 { user, token }` |
| POST | `/auth/login` | `{ email, password }` | `200 { user, token }` |

### Probes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness — process is up |
| GET | `/ready` | Readiness — Mongo answers ping |

### Characters

| Method | Path | Description |
|--------|------|-------------|
| POST | `/characters` | Create |
| GET | `/characters` | List (paginated, filterable) |
| GET | `/characters/:id` | Get by id |
| PATCH | `/characters/:id` | Partial update |
| DELETE | `/characters/:id` | Delete |

**List query params:** `page`, `limit` (≤100), `classe`, `raca`, `search` (case-insensitive name match).

### Character shape

```ts
{
  nome: string;            // 1-100 chars
  idade: number;           // 0-10000
  classe: 'barbaro' | 'bardo' | 'bruxo' | 'clerigo' | 'druida'
        | 'feiticeiro' | 'guerreiro' | 'ladino' | 'mago'
        | 'monge' | 'paladino' | 'patrulheiro';
  nivel: number;           // 1-20
  raca: 'humano' | 'elfo' | 'anao' | 'halfling' | 'meio-elfo'
      | 'meio-orc' | 'draconato' | 'gnomo' | 'tiefling';
  antecedente: string;     // 1-100 chars
  alinhamento: 'leal-bom' | 'neutro-bom' | 'caotico-bom'
             | 'leal-neutro' | 'neutro' | 'caotico-neutro'
             | 'leal-mau' | 'neutro-mau' | 'caotico-mau';
  imagemPersonagem?: string; // URL, ≤2048
}
```

### Example

```bash
# Register
curl -X POST http://localhost:3000/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"frodo@shire.me","password":"longerpassword","name":"Frodo"}'

# Save the token from the response, then create a character
TOKEN=...
curl -X POST http://localhost:3000/characters \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "nome": "Aragorn",
    "idade": 87,
    "classe": "patrulheiro",
    "nivel": 10,
    "raca": "humano",
    "antecedente": "Herdeiro de Isildur",
    "alinhamento": "leal-bom"
  }'
```

### Error format

```json
{ "error": { "code": "BAD_REQUEST", "message": "validation failed", "details": { ... } } }
```

Codes: `BAD_REQUEST`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `RATE_LIMITED`, `INTERNAL`.

---

## Operational notes

- `GET /health` — process is up (liveness). Does not touch Mongo.
- `GET /ready` — pings Mongo with a 2s deadline (readiness). Docker `HEALTHCHECK` uses this, so a dead database takes the container out of rotation.
- `JWT_SECRET` is validated at boot — server refuses to start if it is shorter than 32 characters.
- All env vars are parsed and typed by Zod (`src/config/env.ts`); typos crash at startup, not in production.
- `TRUST_PROXY=true` only behind a reverse proxy. On a public port it lets clients spoof `X-Forwarded-For` and skip rate limits.
- `CORS_ORIGIN=*` is rejected in production. Set an explicit origin (compose defaults to `http://localhost:5173`).
- Container runs as non-root user `app` (uid created in the Alpine image). Mongo's host port is bound to `127.0.0.1`.
- Graceful shutdown on `SIGTERM` / `SIGINT` waits for in-flight requests, then disconnects Mongoose, and force-exits after 10s.

---

## License

[MIT](LICENSE) © Denis Scarabelli

---

<a id="portugues"></a>

# RPG Character API (PT-BR)

Esta API REST gerencia personagens de RPG para usuários autenticados. Cada
registro pertence a um usuário, os dados de entrada são validados antes da
regra de negócio e credenciais são removidas dos logs estruturados. O
repositório também inclui testes de integração, imagem Docker em múltiplas
etapas e verificações de integração contínua.

## Destaques

- **TypeScript strict** com `noUncheckedIndexedAccess` e sem uso de `any`
- **Express 5** com propagação nativa de erro async (sem wrapper)
- **Fronteiras validadas com Zod** para corpo, parâmetros de rota e query strings
- **Auth JWT** HS256 com `iss`/`aud` explícitos, bcryptjs (12 rounds), rate limit próprio nas rotas de auth (10 req / 15 min)
- **Dados por dono** — get/patch/delete do id de outro usuário devolve 404 (testado)
- **Logging estruturado** com Pino; `Authorization` e `Cookie` omitidos
- **HTTP endurecido** — Helmet, CORS, limite de 100kb no body, rate limit global + auth, `x-powered-by` desligado
- **Prazos** — timeout de connect/query no Mongo, `requestTimeout` HTTP, shutdown com teto
- **Liveness vs readiness** — `GET /health` é o processo; `GET /ready` pinga o Mongo
- **Arquitetura em camadas** — `routes → controllers → services → models` com tipos de erro explícitos
- **Testes** — Vitest + Supertest + `mongodb-memory-server`, sem mock contra o banco
- **Docker multi-stage** rodando como usuário `app` não-root; healthcheck bate em `/ready`
- **CI no GitHub Actions** — typecheck, lint, build e teste em todo push

## Como rodar

### Pré-requisitos
- Node 22+
- MongoDB local, ou Docker

### Local

```bash
git clone https://github.com/DenisCDev/nodejsexpress-api.git
cd nodejsexpress-api
cp .env.example .env
# edite o .env: MONGODB_URI e um JWT_SECRET de 32+ caracteres (o placeholder não sobe)
npm install
npm run dev
```

API escutando em `http://localhost:3000`.

### Docker

```bash
cp -n .env.example .env
# defina JWT_SECRET no .env com um valor aleatório de pelo menos 32 caracteres
# mantenha o mesmo arquivo se você já configurou o ambiente local
docker compose up --build
```

### Testes

```bash
npm test                # rodada única
npm run test:watch      # modo watch
npm run test:coverage   # com relatório de cobertura
```

Os testes sobem um Mongo real via `mongodb-memory-server` — sem mocks, sem
fixtures, ciclos completos de request/response.

## API

Todos os endpoints de `/characters` exigem `Authorization: Bearer <token>`.

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/auth/register` | Cria usuário e retorna token |
| POST | `/auth/login` | Autentica e retorna token |
| POST | `/characters` | Cria personagem |
| GET | `/characters` | Lista (paginada, filtrável por `classe`, `raca`, `search`) |
| GET | `/characters/:id` | Busca por id |
| PATCH | `/characters/:id` | Atualização parcial |
| DELETE | `/characters/:id` | Remove |

Formato de erro e códigos (`BAD_REQUEST`, `UNAUTHORIZED`, `FORBIDDEN`,
`NOT_FOUND`, `CONFLICT`, `RATE_LIMITED`, `INTERNAL`), shape do personagem e
exemplos de `curl` estão na seção em inglês acima — são idênticos.

## Notas operacionais

- `GET /health` — o processo está no ar (liveness). Não toca no Mongo.
- `GET /ready` — pinga o Mongo com prazo de 2s (readiness). O `HEALTHCHECK` do Docker usa essa rota.
- `JWT_SECRET` é validado no boot — o servidor se recusa a subir com menos de 32 caracteres.
- Todas as env vars são parseadas e tipadas por Zod (`src/config/env.ts`); erro de digitação quebra no startup, não em produção.
- `TRUST_PROXY=true` só atrás de um reverse proxy. Em porta pública o cliente forja `X-Forwarded-For` e fura o rate limit.
- `CORS_ORIGIN=*` é recusado em produção. Coloque uma origem explícita (o compose usa `http://localhost:5173`).
- O container roda como usuário `app` não-root. A porta do Mongo no host fica em `127.0.0.1`.
- Shutdown gracioso em `SIGTERM` / `SIGINT` espera request em voo, desconecta o Mongoose e força a saída em 10s.

## Licença

[MIT](LICENSE) © Denis Scarabelli
