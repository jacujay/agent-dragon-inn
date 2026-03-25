# Agent Dragon Inn

> The OS for your AI agent workforce.

## Project Structure

```
agent-dragon-inn/
├── apps/
│   ├── web/          # Next.js 15 frontend (App Router)
│   └── api/          # Fastify backend API (Node.js 22 + TypeScript)
├── packages/
│   └── shared/       # Shared TypeScript types, Zod schemas, utilities
├── .github/workflows/ # CI/CD (GitHub Actions)
└── turbo.json        # Turborepo config
```

## Quick Start

### Prerequisites

- Node.js 22+
- pnpm 9+
- PostgreSQL 16 (local or Neon/Supabase)
- Redis 7+ (for BullMQ job queue)

### Setup

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env
# Fill in .env with your credentials

# Generate Prisma client
pnpm db:generate

# Run database migrations
pnpm db:migrate

# Start development servers
pnpm dev
```

- **Web**: http://localhost:3000
- **API**: http://localhost:3001
- **API Docs**: http://localhost:3001/docs

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Zustand, TanStack Query |
| Backend | Node.js 22, Fastify 5, TypeScript, Prisma 6, BullMQ |
| Database | PostgreSQL 16 + pgvector |
| Auth | Clerk |
| AI Providers | OpenAI SDK, Anthropic SDK (raw API, no LangChain) |
| Deployment | Vercel (frontend), Railway (backend) |

## Development

```bash
# Type check all packages
pnpm typecheck

# Lint all packages
pnpm lint

# Run tests
pnpm test

# Database operations
pnpm db:generate   # Generate Prisma types
pnpm db:migrate    # Run migrations
pnpm db:push       # Push schema to DB (dev only)
pnpm db:studio     # Open Prisma Studio
pnpm db:seed       # Seed database
```

## Monorepo

Managed with **Turborepo**. Shared packages are built and cached automatically.

## License

Proprietary — Agent Dragon Inn
