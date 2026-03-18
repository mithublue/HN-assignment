# Smart Hacker News Reader

A full-stack Hacker News client with bookmarking and AI-powered discussion summaries.

---

## Setup Instructions

### Option 1 — Docker (recommended, no local dependencies needed)

```bash
docker-compose up
```

Open http://localhost:3000. That's it — MySQL, schema setup, and the app all start automatically.

To stop:
```bash
docker-compose down
```

To rebuild after code changes:
```bash
docker-compose up --build
```

---

### Option 2 — Local Development

**Prerequisites:** Node.js 20+, MySQL 8.0 running locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment — create a `.env` file:
   ```env
   DATABASE_URL="mysql://root:@localhost:3306/hackernews"
   DATABASE_USER="root"
   DATABASE_PASSWORD=""
   DATABASE_NAME="hackernews"
   DATABASE_HOST="localhost"
   DATABASE_PORT=3306
   MISTRAL_API_KEY="your_key_here"
   ```

3. Generate Prisma client and push schema:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. Start the dev server:
   ```bash
   npm run dev
   ```

Open http://localhost:3000.

---

## Architecture & Approach

### Stack
- **Next.js 16** (App Router) — full-stack framework handling both UI and API routes in one project
- **React 19 + TypeScript** — type-safe UI with hooks
- **Tailwind CSS 4** — utility-first styling
- **TanStack React Query** — server state management, caching, and background refetching
- **Prisma 7 ORM** — type-safe database access with MySQL adapter
- **MySQL 8** — relational database for bookmarks and AI summaries
- **Mistral AI** (`mistral-small-latest`) — discussion summarization

### Key Decisions

**Next.js App Router as full-stack**
Rather than a separate backend, all API routes live inside the Next.js project under `app/api/`. This keeps the codebase unified and deployment simple — one Docker container serves everything.

**Prisma 7 with driver adapter**
Prisma 7 removed built-in database drivers and requires an explicit adapter. We use `@prisma/adapter-mariadb` for MySQL connectivity. The connection config lives in `lib/prisma.ts` (not `schema.prisma`), and the generated client outputs to `generated/prisma/` instead of `node_modules`.

**React Query for data fetching**
Instead of `useEffect` + `useState`, React Query handles all server state. This gives automatic caching, background refetching on window focus, and clean loading/error states with minimal boilerplate.

**AI summaries cached in DB**
Generating a summary hits the Mistral API and fetches all comments — which is slow and costs API credits. Summaries are stored in the `Summary` table after first generation. Subsequent requests return the cached result instantly.

**Recursive comment fetching**
HN comments are nested trees. The comments API recursively fetches all replies up to 10 levels deep using `Promise.all()` at each level for parallel fetching. Top-level comments are paginated (20 per page) to keep initial load fast.

---

## Tradeoffs

- **Comment load time** — Fetching deeply nested comments requires many sequential API calls to the HN Firebase API. Parallel fetching at each level helps, but a story with 500+ comments across many levels is still slow. A proper solution would cache comment trees server-side.

- **No auth** — Bookmarks are stored globally with no user accounts. This was intentional per the assignment scope, but means all users share the same bookmark list.

- **Mistral API key in `.env`** — A working key is committed for convenience during review. In production this would be injected via secrets management.

- **Prisma 7 migration** — Prisma 7 is a major breaking change (no `url` in `schema.prisma`, requires adapter). This added setup complexity but was necessary to use the latest version as specified.

- **No server-side caching for HN API** — Every story/comment request hits the HN Firebase API directly. Adding Redis or in-memory caching would significantly improve performance under load.

---

## What I'd Improve With More Time

- **Server-side comment caching** — Cache fetched comment trees in Redis or the database to avoid repeated HN API calls
- **User authentication** — Per-user bookmarks using NextAuth.js
- **Optimistic UI updates** — Instant bookmark toggle feedback before the API responds
- **Rate limiting** — Protect the API routes from abuse
- **Infinite scroll** — Replace pagination with infinite scroll on the story list
- **Story search** — Full-text search across story titles on the home page
- **Summary regeneration** — Allow users to refresh a cached summary
- **Tests** — Unit tests for API routes and integration tests for key user flows
- **Error boundaries** — Graceful UI fallbacks for failed API calls
- **PWA support** — Offline reading of bookmarked stories
