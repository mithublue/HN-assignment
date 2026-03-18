# Smart Hacker News Reader

A full-stack Hacker News client with bookmarking and AI-powered discussion summaries.

---

## Setup Instructions

### Important: Two Different `.env` Files

This project has TWO example environment files:

1. **`.env.docker.example`** (1 variable) — For Docker setup
   - Only contains `MISTRAL_API_KEY`
   - All database config is in `docker-compose.yml`

2. **`.env.example`** (7 variables) — For local development
   - Contains database credentials + API key
   - Used when running without Docker

**The actual `.env` file is gitignored and NOT in the repository.** You must create it yourself.

---

### Option 1 — Docker (Recommended)

## Run with Docker Compose

This project can be run with Docker Compose using two containers:

- `app` — Node.js application
- `db` — MySQL 8.0 database

### Prerequisites

Make sure these are installed on your machine:

- Docker
- Docker Compose

### Step 1 — Create the Docker environment file

Create a file named `.env.docker` in the project root:

```env
DATABASE_URL="mysql://appuser:apppass@db:3306/hackernews"
DATABASE_USER="appuser"
DATABASE_PASSWORD="apppass"
DATABASE_NAME="hackernews"
DATABASE_HOST="db"
DATABASE_PORT=3306
MISTRAL_API_KEY="your_key_here"
```

Start the containers:

```
docker compose up --build
```
Open the application:
```
http://localhost:3000
```
To stop the container:

```
docker compose down
```

---

### Option 2 — Local Development (Without Docker)

**Prerequisites:** Node.js 20+, MySQL 8.0 running locally

**Step 1 — Install dependencies**
```bash
npm install
```

**Step 2 — Create `.env` from the local template**
```bash
cp .env.example .env
```

**Step 3 — Configure your database**

Open `.env` and update all 7 variables:
```env
DATABASE_URL="mysql://root:@localhost:3306/hackernews"
DATABASE_USER="root"
DATABASE_PASSWORD=""
DATABASE_NAME="hackernews"
DATABASE_HOST="localhost"
DATABASE_PORT=3306
MISTRAL_API_KEY="your_key_here"
```

> **Why 7 variables?** For local development, you need to provide your own MySQL credentials since there's no Docker container.

**Step 4 — Set up the database**
```bash
npx prisma generate
npx prisma db push
```

**Step 5 — Start the dev server**
```bash
npm run dev
```

Open http://localhost:3000.

---

## Architecture & Approach

### Stack
- **Next.js** (App Router) — full-stack framework, UI + API routes in one project
- **React + TypeScript** — type-safe UI with hooks
- **Tailwind CSS** — utility-first styling
- **TanStack React Query** — server state, caching, background refetching
- **Prisma 7 ORM** — type-safe database access with MySQL adapter
- **MySQL 8** — relational database for bookmarks and AI summaries
- **Mistral AI** (`mistral-small-latest`) — discussion summarization

### Key Decisions

**Next.js App Router as full-stack**
All API routes live inside the Next.js project under `app/api/`. One codebase, one Docker container, one deployment.

**Prisma 7 with driver adapter**
Prisma 7 removed built-in database drivers and requires an explicit adapter. We use `@prisma/adapter-mariadb` for MySQL. The connection config lives in `lib/prisma.ts`, and the generated client outputs to `generated/prisma/` instead of `node_modules`.

**React Query for data fetching**
Handles all server state — caching, background refetching on window focus, and clean loading/error states with minimal boilerplate.

**AI summaries cached in DB**
Generating a summary hits the Mistral API and fetches all comments, which is slow and costs API credits. Summaries are stored in the `Summary` table after first generation and returned instantly on subsequent requests.

**Recursive comment fetching**
HN comments are nested trees. The comments API recursively fetches all replies up to 10 levels deep using `Promise.all()` at each level for parallel fetching. Top-level comments are paginated (20 per page) to keep initial load fast.

---

## Tradeoffs

- **Comment load time** — Deeply nested comments require many sequential HN API calls. Parallel fetching at each level helps, but large threads are still slow. A proper fix would cache comment trees server-side.
- **No auth** — Bookmarks are global with no user accounts. Intentional per scope, but means all users share the same list.
- **No server-side HN caching** — Every request hits the HN Firebase API directly. Redis or in-memory caching would improve performance under load.
- **Prisma 7 complexity** — Prisma 7 is a major breaking change (no `url` in `schema.prisma`, requires adapter). Added setup complexity but keeps the stack current.

---

## What I'd Improve With More Time

- Server-side comment caching (Redis or DB) to avoid repeated HN API calls
- Per-user bookmarks with authentication (NextAuth.js)
- Optimistic UI updates for instant bookmark toggle feedback
- Rate limiting on API routes
- Infinite scroll on the story list
- Full-text search across story titles
- Summary regeneration (allow refreshing a cached summary)
- Error boundaries for graceful UI fallbacks
- PWA support for offline reading of bookmarked stories
