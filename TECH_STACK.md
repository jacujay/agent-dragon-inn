# Agent Dragon Inn — Technical Architecture

**Version:** 1.0  
**Audience:** CEO & Technical Leadership  
**Status:** Planning

---

## 1. Tech Stack Selection

### 1.1 Frontend

**Stack:** Next.js 15 (App Router) + TypeScript + Tailwind CSS + shadcn/ui + Zustand + TanStack Query

| Layer | Choice | Rationale |
|---|---|---|
| Framework | Next.js 15 App Router | Server Components reduce client bundle; built-in streaming (critical for agent output); strong SSR/SSG flexibility |
| Language | TypeScript (strict) | End-to-end type safety from DB to UI; reduces entire class of runtime bugs |
| Styling | Tailwind CSS + shadcn/ui | shadcn/ui is copy-paste (not a library)—full control over markup; Tailwind enables rapid design iteration without CSS files |
| State | Zustand (client) + TanStack Query (server) | Zustand for lightweight UI state; TanStack Query for all server state with caching, invalidation, and optimistic updates |
| Real-time | Server-Sent Events (SSE) via Next.js Route Handlers | Agent execution logs stream in real-time to the UI; simpler than WebSocket for unidirectional server→client push |

**Alternative considered:** React + Vite. Rejected because Next.js server components and streaming SSR are architectural advantages for an AI tool where UX depends on seeing live agent output.

---

### 1.2 Backend

**Choice: Node.js + Fastify + TypeScript**

Python + FastAPI was the strongest alternative. The decision comes down to three factors:

1. **Unified TypeScript stack.** One language from DB schema to API to frontend. Prisma generates TypeScript types that flow directly into Fastify route handlers and Next.js Server Components. With Python, every boundary requires manual type translation or a schema layer (Pydantic, etc.).

2. **Fastify vs Express.** Fastify provides ~3× throughput over Express, schema-based validation via `@fastify/type-provider-typebox`, built-in OpenAPI generation, and first-class plugin architecture. It is not significantly harder than Express and the performance delta matters at scale.

3. **I/O profile of agent workflows.** The hot path is HTTP round-trips to AI providers (OpenAI, Anthropic, etc.) and message queuing—classic async I/O where Node.js excels. CPU-bound workloads (LLM inference, embedding generation) are offloaded to external APIs or dedicated ML services, not this layer.

**Python enters the architecture** via microservices for any ML-specific processing that requires it (e.g., fine-tuning pipelines, custom embedding models). The Fastify API gateway is orchestration-only.

---

### 1.3 Database

**Choice: PostgreSQL 16 + Prisma**

| Option | Verdict |
|---|---|
| PostgreSQL + Prisma | ✅ **Selected** — Full schema control, Prisma Migrate for versioned migrations, TypeScript-first DX, excellent query performance for relational data |
| Supabase | Considered — Adds auth, storage, and real-time subscriptions on top of Postgres. The abstraction layer limits complex org hierarchies and row-level security customization needed for B2B tenant isolation |

**Why relational over document store?** Agent workflows have deeply structured, relational data: an org has users, users own agents, agents participate in workflows, workflows generate executions, executions produce structured logs. Normalized PostgreSQL with Prisma's relation API handles this cleanly.

**Extensions in scope:**
- `pgvector` — For agent memory / semantic search (upcoming Phase 2)
- `pg_trgm` — For fuzzy name/search matching
- `uuid-ossp` — UUID generation

---

### 1.4 Authentication & Authorization

**Choice: Clerk**

| Option | Verdict |
|---|---|
| Clerk | ✅ **Selected** — Organization management built-in, multi-role support (owner/admin/member), SAML/SSO ready (critical for enterprise), hosted UIs for sign-in/sign-up, webhook-based user lifecycle events |
| NextAuth.js v5 | Considered — Flexible but requires building org/multi-tenant logic from scratch; Clerk's org model maps directly to our `Organization` data model |

Clerk's `organization` concept maps 1:1 to our `Organization` entity. The `委id` (organization role) concept in Clerk (admin/member/billing) maps to our `OrganizationMember.role` enum.

**Auth architecture:** Clerk handles user identity + session. Our backend issues short-lived JWTs (via Clerk's backend API) for service-to-service calls and API key authentication for developer integrations.

---

### 1.5 Deployment

**Choice: Railway (backend) + Vercel (frontend) + Supabase (managed Postgres)**

| Component | Platform | Rationale |
|---|---|---|
| Frontend | **Vercel** | First-class Next.js support; preview deployments per PR; Edge Network for global low-latency |
| Backend API | **Railway** | Persistent instances needed (not serverless for agent workers); PostgreSQL add-on with automatic backups; SSH access for debugging; seamless horizontal scaling |
| Database | **Supabase** (managed Postgres) or **Neon** | Fully managed Postgres with branching for dev/staging; connection pooling (critical for serverless frontend + persistent DB connections) |
| Object Storage | **Cloudflare R2** | S3-compatible; cheaper than S3; integrates with Cloudflare's CDN |

**Why not AWS?**
AWS is powerful but introduces significant DevOps overhead (ECS/EKS, ALBs, RDS, IAM, etc.) at a stage where velocity matters more than infrastructure customization. Railway + Vercel provide 80% of AWS's capability at a fraction of the operational cost.

---

### 1.6 AI Integration

**Choice: Raw API calls + custom orchestration layer (no LangChain/LlamaIndex)**

| Approach | Verdict |
|---|---|
| Raw API (OpenAI SDK, Anthropic SDK) | ✅ **Selected** — Full control over retry logic, rate limiting, cost tracking, and prompt versioning; minimal abstraction overhead |
| LangChain | Considered — Useful for prototyping; rejected because: (a) abstraction leakage forces you to think in LangChain concepts, (b) difficult to debug/trace when things go wrong, (c) adds a large transitive dependency |
| LlamaIndex | Considered — Strong for RAG; rejected because our primary need is orchestration, not retrieval. Can add LlamaIndex later for memory/retrieval features |

**Our orchestration layer implements:**
- Provider abstraction (OpenAI / Anthropic / Azure OpenAI / custom endpoints)
- Retry with exponential backoff + circuit breaker
- Token usage tracking per model per request
- Streaming response passthrough (SSE)
- Prompt template versioning
- Cost estimation pre-execution

**Future (Phase 2):** Add LangChain or LlamaIndex only when we need to offer low-code "connect a data source" RAG features. The custom layer stays.

---

## 2. System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                     │
│   ┌──────────────────┐         ┌──────────────────┐                    │
│   │  Web App (Next.js)│         │  Developer API   │                    │
│   │  Vercel Edge      │         │  (REST + Webhook)│                    │
│   └────────┬─────────┘         └────────┬─────────┘                    │
└────────────┼────────────────────────────┼──────────────────────────────┘
             │ HTTPS                        │ HTTPS + API Keys
             ▼                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           EDGE / CDN LAYER                              │
│              Cloudflare (WAF + DDoS + R2 for static assets)             │
└─────────────────────────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         RAILWAY (Backend)                               │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    Fastify API Server                            │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────────┐ │  │
│  │  │ Auth     │ │ Agent    │ │ Workflow │ │ Execution            │ │  │
│  │  │ Router   │ │ Router   │ │ Router   │ │ Router               │ │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────────────┘ │  │
│  │  ┌──────────────────────────────────────────────────────────┐    │  │
│  │  │              AI Orchestration Layer                       │    │  │
│  │  │  ┌─────────┐  ┌──────────┐  ┌────────────────────────┐  │    │  │
│  │  │  │ Provider │  │ Retry +  │  │ Token & Cost           │  │    │  │
│  │  │  │ Adapter  │  │ Circuit  │  │ Tracker                │  │    │  │
│  │  │  │ (OpenAI, │  │ Breaker  │  │                        │  │    │  │
│  │  │  │ Anthropic│  │          │  │                        │  │    │  │
│  │  │  │ Azure)   │  │          │  │                        │  │    │  │
│  │  │  └─────────┘  └──────────┘  └────────────────────────┘  │    │  │
│  │  └──────────────────────────────────────────────────────────┘    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    Agent Execution Worker                         │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │  │
│  │  │ Queue        │  │ Executor     │  │ Streaming Handler    │   │  │
│  │  │ (BullMQ +    │  │ (runs workflow│  │ (SSE → clients)      │   │  │
│  │  │  Redis)       │  │  steps)      │  │                      │   │  │
│  │  └──────────────┘  └──────────────┘  └──────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└──────────────┬───────────────────────────┬─────────────────────────────
               │                           │
    ┌──────────┴──────────┐     ┌─────────┴──────────┐
    │   PostgreSQL 16      │     │   Redis (BullMQ)   │
    │   (Neon / Supabase)  │     │   (Upstash)        │
    └──────────────────────┘     └───────────────────┘
               │
    ┌──────────┴──────────┐
    │   pgvector extension │
    │   (agent memory)     │
    └──────────────────────┘
```

### Data Flow: Execution Path

```
User clicks "Run" 
  → Next.js Client 
    → Fastify POST /executions 
      → Validate + enqueue job in BullMQ 
        → Return 202 Accepted (execution_id)
          → Worker picks up job
            → For each step in workflow:
                → Call AI Provider (OpenAI/Anthropic)
                → Stream tokens via SSE to frontend
                → Log to DB
            → Mark execution complete
  → Frontend receives SSE stream → renders live logs
```

---

## 3. Core Data Models (ERD)

### 3.1 Entity Relationship Overview

```
Organization ───< OrganizationMember >─── User
     │
     ├──< Agent
     │       └──< AgentVariable
     │
     ├──< Workflow
     │       └──< WorkflowStep
     │               └──< WorkflowStepVariable
     │
     ├──< Execution
     │       └──< ExecutionStep  (log + output per step)
     │
     └──< ApiKey

User ───< AuditLog
```

### 3.2 Detailed Schema

#### User (managed by Clerk, synced to our DB)

| Field | Type | Notes |
|---|---|---|
| id | `uuid` | PK, Clerk user ID |
| email | `string` | Unique |
| name | `string` | |
| createdAt | `datetime` | |
| updatedAt | `datetime` | |

> **Note:** User records are created via Clerk webhooks (`user.created`, `user.updated`, `user.deleted`). We do not manage passwords.

#### Organization

| Field | Type | Constraints |
|---|---|---|
| id | `uuid` | PK |
| name | `string` | Not null |
| slug | `string` | Unique, URL-safe |
| plan | `enum` | `free`, `pro`, `enterprise` |
| createdAt | `datetime` | |
| updatedAt | `datetime` | |

#### OrganizationMember

| Field | Type | Constraints |
|---|---|---|
| id | `uuid` | PK |
| organizationId | `uuid` | FK → Organization |
| userId | `uuid` | FK → User |
| role | `enum` | `owner`, `admin`, `member`, `viewer` |
| joinedAt | `datetime` | |

**Constraint:** Unique (organizationId, userId)

#### Agent

| Field | Type | Constraints |
|---|---|---|
| id | `uuid` | PK |
| organizationId | `uuid` | FK → Organization |
| name | `string` | Not null |
| description | `text` | Optional |
| modelProvider | `enum` | `openai`, `anthropic`, `azure` |
| modelName | `string` | e.g., `gpt-4o`, `claude-sonnet-4-20250514` |
| systemPrompt | `text` | |
| temperature | `float` | Default 0.7 |
| maxTokens | `int` | |
| config | `jsonb` | Provider-specific config |
| isActive | `boolean` | Soft delete |
| createdById | `uuid` | FK → User |
| createdAt | `datetime` | |
| updatedAt | `datetime` | |

#### AgentVariable

| Field | Type | Constraints |
|---|---|---|
| id | `uuid` | PK |
| agentId | `uuid` | FK → Agent |
| name | `string` | `{{variable_name}}` syntax |
| description | `string` | |
| defaultValue | `string` | Optional |

#### Workflow

| Field | Type | Constraints |
|---|---|---|
| id | `uuid` | PK |
| organizationId | `uuid` | FK → Organization |
| name | `string` | |
| description | `text` | |
| triggerType | `enum` | `manual`, `webhook`, `schedule`, `api` |
| triggerConfig | `jsonb` | Webhook URL, cron expression, etc. |
| isActive | `boolean` | |
| createdById | `uuid` | FK → User |
| createdAt | `datetime` | |
| updatedAt | `datetime` | |

#### WorkflowStep

| Field | Type | Constraints |
|---|---|---|
| id | `uuid` | PK |
| workflowId | `uuid` | FK → Workflow |
| order | `int` | Step sequence (0-indexed) |
| agentId | `uuid` | FK → Agent |
| name | `string` | Human-readable step name |
| inputMapping | `jsonb` | Maps previous step outputs to this step's inputs |
| condition | `jsonb` | Optional: `if {{output}} == "X" then skip/step` |
| timeoutSeconds | `int` | Default 120 |

#### Execution

| Field | Type | Constraints |
|---|---|---|
| id | `uuid` | PK |
| workflowId | `uuid` | FK → Workflow |
| organizationId | `uuid` | FK → Organization |
| triggeredById | `uuid` | FK → User (null for webhook/schedule) |
| triggerType | `enum` | `manual`, `webhook`, `schedule`, `api` |
| status | `enum` | `queued`, `running`, `completed`, `failed`, `cancelled` |
| startedAt | `datetime` | |
| completedAt | `datetime` | Nullable |
| totalTokens | `bigint` | Sum across all steps |
| totalCostUsd | `decimal(10,6)` | |
| errorMessage | `text` | Nullable |
| createdAt | `datetime` | |

#### ExecutionStep

| Field | Type | Constraints |
|---|---|---|
| id | `uuid` | PK |
| executionId | `uuid` | FK → Execution |
| workflowStepId | `uuid` | FK → WorkflowStep |
| order | `int` | |
| status | `enum` | `pending`, `running`, `completed`, `failed`, `skipped` |
| input | `jsonb` | Resolved input values |
| output | `jsonb` | Agent response |
| tokensUsed | `int` | |
| costUsd | `decimal(8,6)` | |
| startedAt | `datetime` | |
| completedAt | `datetime` | Nullable |
| errorMessage | `text` | Nullable |
| logs | `jsonb` | Structured debug logs |

#### ApiKey

| Field | Type | Constraints |
|---|---|---|
| id | `uuid` | PK |
| organizationId | `uuid` | FK → Organization |
| name | `string` | e.g., "Production Webhook Key" |
| keyHash | `string` | SHA-256 of actual key |
| lastUsedAt | `datetime` | |
| expiresAt | `datetime` | Nullable |
| createdById | `uuid` | FK → User |
| createdAt | `datetime` | |

#### AuditLog

| Field | Type | Constraints |
|---|---|---|
| id | `uuid` | PK |
| organizationId | `uuid` | FK → Organization |
| userId | `uuid` | FK → User (nullable) |
| action | `string` | e.g., `workflow.run`, `agent.create`, `member.invite` |
| resourceType | `string` | e.g., `workflow`, `agent` |
| resourceId | `uuid` | |
| metadata | `jsonb` | IP, user agent, change diff |
| createdAt | `datetime` | |

---

## 4. API Design

**Protocol: REST over HTTPS**  
**Format: JSON**  
**Auth: Bearer JWT (from Clerk) for user sessions; `X-API-Key` for programmatic access**

### Why REST over GraphQL

- **Simpler for B2B integrations.** Enterprise customers often have API gateways, Terraform providers, and code generators that work better with REST.
- **Webhook compatibility.** Outbound webhooks (e.g., "execution completed") are a primary integration pattern; REST webhooks are a solved problem.
- **Documentation.** OpenAPI/Swagger generates SDKs in 50+ languages automatically. GraphQL requires custom codegen.
- **Caching.** GET requests are trivially cacheable at the CDN layer.

---

### 10 Key Endpoints

#### Auth & Org

**1. `GET /v1/me`**
Returns the authenticated user's profile, organization memberships, and org roles.

**2. `POST /v1/organizations`**
Create a new organization. The creating user becomes the `owner`.

**3. `POST /v1/organizations/:orgId/invites`**
Invite a user by email to an organization with a specified role. Sends email via Resend/SendGrid.

---

#### Agents

**4. `POST /v1/organizations/:orgId/agents`**
Create a new agent within the organization.

```json
Request:  { "name": "Support Classifier", "modelProvider": "openai", "modelName": "gpt-4o", "systemPrompt": "You are...", "temperature": 0.3 }
Response: { "id": "uuid", "name": "...", "createdAt": "..." }
```

**5. `GET /v1/organizations/:orgId/agents`**
List all agents in the org. Supports `?isActive=true` filter.

**6. `PATCH /v1/organizations/:orgId/agents/:agentId`**
Update agent configuration. Triggers an audit log entry.

---

#### Workflows

**7. `POST /v1/organizations/:orgId/workflows`**
Create a workflow. Body includes workflow metadata + nested steps array.

**8. `GET /v1/organizations/:orgId/workflows/:workflowId`**
Get workflow detail including all steps and their agent references.

---

#### Executions

**9. `POST /v1/organizations/:orgId/workflows/:workflowId/executions`**
Trigger a workflow execution. Returns `202 Accepted` with `executionId`. Body includes input variables.

```json
Request:  { "variables": { "ticket_id": "12345", "customer_text": "I need help" } }
Response: { "executionId": "uuid", "status": "queued", "createdAt": "..." }
```

**Stream:** Clients subscribe to `/v1/executions/:executionId/stream` (SSE) to receive real-time step logs.

**10. `GET /v1/organizations/:orgId/executions`**
List executions with filters: `workflowId`, `status`, `dateFrom`, `dateTo`, `triggeredBy`. Paginated.

---

### Webhooks (Outbound)

| Event | Trigger |
|---|---|
| `execution.completed` | Workflow run finishes successfully |
| `execution.failed` | Workflow run fails |
| `agent.invoked` | (Optional debug) Each agent step completes |

Payload includes `organizationId`, `executionId`, `timestamp`, and event-specific data.

---

## 5. Security Considerations

### 5.1 Authentication

| Subject | Auth Method | Details |
|---|---|---|
| End users (web app) | Clerk | Hosted sign-in; Clerk issues session JWT; our backend validates via Clerk's JWKS endpoint |
| API consumers (developers) | API Keys | SHA-256 hashed and stored; plaintext never stored or logged; prefixed `adk_live_` for identification |
| Internal service-to-service | Short-lived JWTs | Issued by our API using Clerk's `clerkBackendApi` |

### 5.2 Data Isolation (Multi-tenancy)

**All data queries are scoped by `organizationId`.** This is enforced at the Prisma level via a custom middleware that injects `organizationId` into every query.

```
Prisma Middleware (every query):
  1. Extract orgId from JWT claims
  2. Inject orgId filter into `where` clause
  3. Throw 403 if resource's orgId !== JWT orgId
```

Row-Level Security (RLS) on PostgreSQL provides a second layer of enforcement for any raw SQL.

### 5.3 API Keys

| Practice | Implementation |
|---|---|
| Hashing | `SHA-256(key)` stored; plaintext sent once at creation, shown once, never retrievable |
| Scoping | Keys scoped to `organizationId`; no cross-org access possible |
| Expiry | Optional `expiresAt`; keys can be manually revoked |
| Rate limiting | 1000 req/min per org on API endpoints; 10 req/min per org on execution triggers |
| Audit | Every API key request logged with IP, user agent, timestamp |

### 5.4 AI Provider Credentials

- Provider API keys stored in environment variables on Railway (not in the database)
- Keys are org-scoped for Azure OpenAI (Azure uses deployment-level keys)
- OpenAI/Anthropic keys stored encrypted at rest using Railway's encrypted environment variables

### 5.5 Network Security

- All traffic over HTTPS (TLS 1.3)
- Cloudflare WAF rules: block known malicious IPs, rate limit by IP, geo-blocking
- No publicly accessible database ports; PostgreSQL accessed only via Prisma Proxy / private networking
- Railway deployment in `us-east-1` with private networking

### 5.6 Compliance Notes

| Concern | Approach |
|---|---|
| Data retention | Execution logs retained for 90 days on Pro plan; configurable per org |
| PII | Agent prompts/outputs may contain customer PII; execution logs are org-scoped, not shared |
| SOC 2 | Targeted for Phase 2; start logging infrastructure in Phase 1 |

---

## 6. Development Roadmap

### Phase 1 — Foundation (Months 1–3)

**Goal:** MVP — Create agents, build workflows, run executions, view logs.

| Milestone | Description | Target |
|---|---|---|
| M1.1 | Project scaffolding: monorepo (Next.js + Fastify + Prisma), CI/CD (GitHub Actions), environments (dev/staging/prod) | Week 2 |
| M1.2 | Clerk auth + org model wired up; all API routes scoped by org | Week 4 |
| M1.3 | Agent CRUD with OpenAI + Anthropic provider adapters | Week 6 |
| M1.4 | Workflow builder UI (visual editor) + workflow execution engine (BullMQ) | Week 9 |
| M1.5 | Execution streaming UI (SSE → live log viewer) | Week 11 |
| M1.6 | API keys for developer access + basic webhook outbound events | Week 13 |

---

### Phase 2 — Intelligence & Scale (Months 4–7)

**Goal:** Enterprise-readiness, agent memory, observability.

| Milestone | Description | Target |
|---|---|---|
| M2.1 | SAML/SSO (Okta, Azure AD) via Clerk | Month 4 |
| M2.2 | Agent memory (pgvector): semantic retrieval from past executions | Month 4 |
| M2.3 | Usage analytics dashboard: token spend per agent, workflow, org | Month 5 |
| M2.4 | Workflow branching + conditional logic (if/else based on step output) | Month 5 |
| M2.5 | Team seats + role-based access control (viewer cannot run workflows) | Month 6 |
| M2.6 | SOC 2 Type I readiness | Month 7 |

---

### Phase 3 — Platform & Ecosystem (Months 8–12)

**Goal:** Marketplace, low-code nodes, multi-region.

| Milestone | Description | Target |
|---|---|---|
| M3.1 | Agent marketplace: share agents across orgs | Month 8 |
| M3.2 | Native integrations: Slack, Notion, HubSpot, Salesforce triggers | Month 9 |
| M3.3 | Low-code data connectors: upload CSV, connect to Airtable/Google Sheets | Month 10 |
| M3.4 | Multi-region deployment (US + EU) for data residency | Month 11 |
| M3.5 | SOC 2 Type II + GDPR data processing agreements | Month 12 |

---

## Appendix: Technology Summary

| Layer | Technology | Version |
|---|---|---|
| Frontend | Next.js | 15 |
| Frontend | TypeScript | 5.x (strict) |
| Frontend | Tailwind CSS | 4.x |
| Frontend | shadcn/ui | latest |
| Frontend | TanStack Query | v5 |
| Frontend | Zustand | v5 |
| Backend | Node.js | 22 LTS |
| Backend | Fastify | 5.x |
| Backend | TypeScript | 5.x |
| ORM | Prisma | 6.x |
| Database | PostgreSQL | 16 |
| Vector search | pgvector | 0.7.x |
| Queue | BullMQ | 5.x |
| Cache | Redis (Upstash) | |
| Auth | Clerk | |
| AI Providers | OpenAI SDK + Anthropic SDK | |
| Deployment (FE) | Vercel | |
| Deployment (BE) | Railway | |
| Storage | Cloudflare R2 | |
| Monitoring | Axiom (structured logs) + Sentry (errors) | |
| CI/CD | GitHub Actions | |

---

*Document version 1.0 — for internal planning. Update as architecture evolves.*
