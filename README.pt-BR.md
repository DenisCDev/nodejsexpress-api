<h1 align="center">RPG Character API</h1>

<p align="center"><a href="README.md">English</a> · <b>Português</b></p>

<p align="center">
  <b>Uma API de personagens de RPG com autenticação, validação, testes e Docker</b>
</p>

<p align="center">
  <a href="https://github.com/DenisCDev/nodejsexpress-api/actions/workflows/ci.yml"><img src="https://github.com/DenisCDev/nodejsexpress-api/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/node-22%20LTS-43A48E?labelColor=171310" alt="Node 22 LTS"></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/typescript-strict-43A48E?labelColor=171310" alt="TypeScript strict"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-D4A24E?labelColor=171310" alt="licença MIT"></a>
</p>

<p align="center">
  <img src="assets/mtg-banquet-guests.jpg" width="640" alt="Hobbits erguendo canecas em um banquete, com pão e bandeirolas — arte de Viko Menezes, Tales of Middle-earth Commander (2023)">
</p>

<p align="center">
  <sub><i>"food and cheer and song"</i><br>
  — <b>O Hobbit</b>, capítulo XIX · arte de Viko Menezes para Magic: The Gathering, Tales of Middle-earth Commander (2023)
</p>

Esta API REST gerencia personagens de RPG de usuários autenticados. Cada
registro pertence ao seu dono, os dados de entrada são validados antes de
chegar à regra de negócio e as credenciais são removidas dos logs estruturados.
O repositório também inclui testes de integração, uma imagem Docker multi-stage
e verificações de integração contínua.

---

## Destaques

- **TypeScript strict** com `noUncheckedIndexedAccess` e nenhum uso de `any`
- **Express 5** com propagação nativa de erros assíncronos (sem wrapper)
- **Fronteiras validadas com Zod** para corpo da requisição, parâmetros de rota e query strings
- **Auth JWT** HS256 com `iss`/`aud` explícitos, bcryptjs (12 rounds), rate limit próprio nas rotas de auth (10 req / 15 min)
- **Dados restritos ao dono** — get/patch/delete no id de outro usuário retorna 404 (testado)
- **Logging estruturado** com Pino; `Authorization` e `Cookie` ocultados
- **HTTP reforçado** — Helmet, CORS, limite de 100kb no corpo, rate limits global + de auth, `x-powered-by` desligado
- **Prazos** — timeouts de conexão e consulta no Mongo, `requestTimeout` do HTTP, graceful shutdown com limite de tempo
- **Liveness vs readiness** — `GET /health` indica o processo; `GET /ready` faz ping no Mongo
- **Arquitetura em camadas** — `routes → controllers → services → models` com tipos de erro explícitos
- **Testes** — Vitest + Supertest + `mongodb-memory-server`, sem mocks do banco
- **Docker multi-stage** rodando com o usuário não-root `app`; o healthcheck consulta `/ready`
- **CI no GitHub Actions** — typecheck, lint, build e testes a cada push

---

## Stack

| Camada | Escolha |
|--------|---------|
| Runtime | Node 22 LTS |
| Linguagem | TypeScript 5.7 (strict + `noUncheckedIndexedAccess`) |
| HTTP | Express 5 |
| ODM | Mongoose 8 |
| Validação | Zod 3 |
| Auth | jsonwebtoken + bcryptjs |
| Logging | Pino + pino-http |
| Testes | Vitest + Supertest + mongodb-memory-server |
| Container | Docker (multi-stage, não-root) |
| CI | GitHub Actions |

---

## Arquitetura

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

**Disciplina de fronteira:** toda entrada é processada pelo Zod antes de chegar a um service. Os services lançam instâncias tipadas de `AppError`; o middleware global de erros as converte em respostas HTTP. Nada mais lança erros para a rede.

---

## Início rápido

### Pré-requisitos
- Node 22+
- MongoDB rodando localmente, ou Docker

### Local

```bash
git clone https://github.com/DenisCDev/nodejsexpress-api.git
cd nodejsexpress-api
cp .env.example .env
# edite o .env: defina MONGODB_URI e um JWT_SECRET com 32+ caracteres (o placeholder não inicia)
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
npm test                # execução única
npm run test:watch      # modo watch
npm run test:coverage   # com relatório de cobertura
```

Os testes sobem um Mongo real via `mongodb-memory-server` — sem mocks, sem fixtures, com ciclos completos de requisição/resposta. Os arquivos rodam em sequência para não apagarem o banco em memória compartilhado uns dos outros.

---

## API

Todos os endpoints de `/characters` exigem `Authorization: Bearer <token>`.

Os nomes dos campos do domínio (`nome`, `classe`, `raca`, …) seguem o D&D 5e em português — essa é a linguagem do produto, não a convenção de banco de dados do restante do código.

### Auth

| Método | Rota | Corpo | Resposta |
|--------|------|-------|----------|
| POST | `/auth/register` | `{ email, password, name }` | `201 { user, token }` |
| POST | `/auth/login` | `{ email, password }` | `200 { user, token }` |

### Probes

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/health` | Liveness — o processo está no ar |
| GET | `/ready` | Readiness — o Mongo responde ao ping |

### Personagens

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/characters` | Criar |
| GET | `/characters` | Listar (paginado, com filtros) |
| GET | `/characters/:id` | Buscar por id |
| PATCH | `/characters/:id` | Atualização parcial |
| DELETE | `/characters/:id` | Excluir |

**Query params da listagem:** `page`, `limit` (≤100), `classe`, `raca`, `search` (busca por nome sem diferenciar maiúsculas e minúsculas).

### Formato do personagem

```ts
{
  nome: string;            // 1-100 caracteres
  idade: number;           // 0-10000
  classe: 'barbaro' | 'bardo' | 'bruxo' | 'clerigo' | 'druida'
        | 'feiticeiro' | 'guerreiro' | 'ladino' | 'mago'
        | 'monge' | 'paladino' | 'patrulheiro';
  nivel: number;           // 1-20
  raca: 'humano' | 'elfo' | 'anao' | 'halfling' | 'meio-elfo'
      | 'meio-orc' | 'draconato' | 'gnomo' | 'tiefling';
  antecedente: string;     // 1-100 caracteres
  alinhamento: 'leal-bom' | 'neutro-bom' | 'caotico-bom'
             | 'leal-neutro' | 'neutro' | 'caotico-neutro'
             | 'leal-mau' | 'neutro-mau' | 'caotico-mau';
  imagemPersonagem?: string; // URL, ≤2048
}
```

### Exemplo

```bash
# Cadastro
curl -X POST http://localhost:3000/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"frodo@shire.me","password":"longerpassword","name":"Frodo"}'

# Guarde o token da resposta e crie um personagem
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

### Formato de erro

```json
{ "error": { "code": "BAD_REQUEST", "message": "validation failed", "details": { ... } } }
```

Códigos: `BAD_REQUEST`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `RATE_LIMITED`, `INTERNAL`.

---

## Notas operacionais

- `GET /health` — o processo está no ar (liveness). Não toca no Mongo.
- `GET /ready` — faz ping no Mongo com prazo de 2s (readiness). O `HEALTHCHECK` do Docker usa essa rota, então um banco fora do ar tira o container de rotação.
- `JWT_SECRET` é validado na inicialização — o servidor se recusa a subir se ele tiver menos de 32 caracteres.
- Todas as variáveis de ambiente são processadas e tipadas pelo Zod (`src/config/env.ts`); erros de digitação derrubam a inicialização, não a produção.
- `TRUST_PROXY=true` só atrás de um reverse proxy. Em uma porta pública, ele permite que clientes falsifiquem `X-Forwarded-For` e escapem dos rate limits.
- `CORS_ORIGIN=*` é rejeitado em produção. Defina uma origem explícita (o compose usa `http://localhost:5173` por padrão).
- O container roda com o usuário não-root `app` (uid criado na imagem Alpine). A porta do Mongo no host fica vinculada a `127.0.0.1`.
- O graceful shutdown em `SIGTERM` / `SIGINT` espera as requisições em andamento, depois desconecta o Mongoose e força a saída após 10s.

---

## Licença

[MIT](LICENSE) © Denis Scarabelli
