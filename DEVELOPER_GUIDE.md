# Developer Guide

Welcome to the Hacker News Reader project! This guide will help you understand the codebase and start contributing quickly.

## Table of Contents
1. [Getting Started](#getting-started)
2. [Architecture Overview](#architecture-overview)
3. [Key Concepts](#key-concepts)
4. [Code Organization](#code-organization)
5. [Common Tasks](#common-tasks)
6. [Best Practices](#best-practices)

## Getting Started

### Prerequisites Knowledge
- **TypeScript**: The entire project is written in TypeScript
- **React**: We use React 19 with hooks and functional components
- **Next.js**: App Router (not Pages Router)
- **Prisma**: ORM for database operations
- **React Query**: For server state management

### First Steps
1. Read the [README.md](./README.md) for setup instructions
2. Run the project with Docker: `docker-compose up`
3. Explore the codebase starting from `app/page.tsx`
4. Check the API routes in `app/api/`

## Architecture Overview

### Tech Stack
```
Frontend:
├── Next.js 16 (React 19)
├── TypeScript
├── Tailwind CSS 4
└── React Query (TanStack Query)

Backend:
├── Next.js API Routes
├── Prisma 7 ORM
├── MySQL 8.0
└── Mistral AI

DevOps:
├── Docker & Docker Compose
├── Node.js 20
└── npm
```

### Request Flow

```
User Action
    ↓
React Component
    ↓
React Query Hook (useQuery/useMutation)
    ↓
API Route (/app/api/*/route.ts)
    ↓
Business Logic (lib/*.ts)
    ↓
External API (HN) or Database (Prisma)
    ↓
Response → Cache → UI Update
```

### Directory Structure Explained

```
app/
├── api/              # Backend API routes (serverless functions)
│   ├── bookmarks/    # CRUD for bookmarks
│   ├── comments/     # Fetch comments with nesting
│   ├── stories/      # Fetch stories from HN
│   └── summarize/    # AI summary generation
├── bookmarks/        # Bookmarks page UI
├── story/[id]/       # Story detail page UI
├── layout.tsx        # Root layout (wraps all pages)
├── page.tsx          # Home page (story list)
└── providers.tsx     # React Query setup

lib/
├── hn-api.ts         # Hacker News API client
├── openai.ts         # Mistral AI integration
├── prisma.ts         # Database client setup
└── types.ts          # Shared TypeScript types

prisma/
├── schema.prisma     # Database schema definition
└── migrations/       # Database version history

generated/
└── prisma/           # Auto-generated Prisma client
```

## Key Concepts

### 1. Prisma 7 with MySQL Adapter

**Why it's different**: Prisma 7 removed built-in database drivers. You must use adapters.

```typescript
// lib/prisma.ts
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../generated/prisma/client';

// Create adapter
const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST,
  // ... other config
});

// Pass adapter to client
const prisma = new PrismaClient({ adapter });
```

**Key points**:
- Connection config is in `lib/prisma.ts`, not `schema.prisma`
- Generated client is in `generated/prisma/`, not `node_modules`
- Must run `npx prisma generate` after schema changes

### 2. React Query for Data Fetching

**Why we use it**: Automatic caching, refetching, and state management.

```typescript
// Example: Fetching stories
const { data, isLoading, error } = useQuery({
  queryKey: ['stories', storyType],  // Cache key
  queryFn: async () => {
    const res = await axios.get(`/api/stories?type=${storyType}`);
    return res.data.stories;
  },
  staleTime: 5 * 60 * 1000,  // Cache for 5 minutes
});
```

**Key points**:
- `queryKey`: Unique identifier for cached data
- `queryFn`: Function that fetches the data
- `staleTime`: How long data is considered fresh
- Automatic refetch on window focus

### 3. Next.js App Router

**File-based routing**:
```
app/page.tsx           → /
app/bookmarks/page.tsx → /bookmarks
app/story/[id]/page.tsx → /story/123
```

**API Routes**:
```
app/api/stories/route.ts       → /api/stories
app/api/stories/[id]/route.ts  → /api/stories/123
```

**Key points**:
- `page.tsx` = UI route
- `route.ts` = API route
- `[id]` = dynamic parameter
- `layout.tsx` = shared layout

### 4. Nested Comments

**Challenge**: HN comments can be nested infinitely deep.

**Solution**: Recursive component + recursive API fetching.

```typescript
// API: Recursively fetch all replies
async function fetchCommentWithReplies(id, depth = 0) {
  if (depth > 10) return null;  // Prevent infinite loops
  
  const comment = await hnAPI.getComment(id);
  if (!comment) return null;
  
  // Recursively fetch child comments
  if (comment.kids) {
    const replies = await Promise.all(
      comment.kids.map(kidId => fetchCommentWithReplies(kidId, depth + 1))
    );
    comment.replies = replies.filter(r => r !== null);
  }
  
  return comment;
}

// UI: Recursive component
function CommentItem({ comment, depth }) {
  return (
    <div style={{ marginLeft: depth * 24 }}>
      <div>{comment.text}</div>
      {comment.replies?.map(reply => (
        <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
      ))}
    </div>
  );
}
```

### 5. AI Summaries with Mistral

**Process**:
1. Fetch all comments for a story
2. Strip HTML and format for AI
3. Send to Mistral AI with structured prompt
4. Parse JSON response
5. Store in database for caching

```typescript
// lib/openai.ts
const response = await mistral.chat.complete({
  model: 'mistral-small-latest',
  messages: [
    { role: 'system', content: 'You are a helpful assistant...' },
    { role: 'user', content: prompt }
  ],
  responseFormat: { type: 'json_object' }  // Force JSON response
});
```

## Code Organization

### Naming Conventions
- **Files**: kebab-case (`story-card.tsx`)
- **Components**: PascalCase (`StoryCard`)
- **Functions**: camelCase (`fetchStories`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Types**: PascalCase (`Story`, `Comment`)

### Component Structure
```typescript
// 1. Imports
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

// 2. Types/Interfaces
interface StoryCardProps {
  story: Story;
  index: number;
}

// 3. Component
export function StoryCard({ story, index }: StoryCardProps) {
  // 3a. Hooks
  const [collapsed, setCollapsed] = useState(false);
  const { data } = useQuery({ ... });
  
  // 3b. Event handlers
  const handleClick = () => { ... };
  
  // 3c. Render
  return <div>...</div>;
}
```

### API Route Structure
```typescript
// app/api/stories/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// 1. Validation schema
const querySchema = z.object({
  type: z.enum(['top', 'new', 'best']),
  limit: z.number().optional()
});

// 2. Handler function
export async function GET(request: NextRequest) {
  try {
    // 2a. Parse and validate
    const params = querySchema.parse({ ... });
    
    // 2b. Business logic
    const stories = await hnAPI.getStories(params.type, params.limit);
    
    // 2c. Return response
    return NextResponse.json({ stories });
  } catch (error) {
    // 2d. Error handling
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
```

## Common Tasks

### Adding a New API Endpoint

1. **Create route file**:
   ```bash
   touch app/api/my-endpoint/route.ts
   ```

2. **Implement handler**:
   ```typescript
   import { NextResponse } from 'next/server';
   
   export async function GET() {
     return NextResponse.json({ message: 'Hello' });
   }
   ```

3. **Add validation** (if needed):
   ```typescript
   import { z } from 'zod';
   
   const schema = z.object({ ... });
   const data = schema.parse(requestData);
   ```

### Adding a Database Model

1. **Update schema**:
   ```prisma
   // prisma/schema.prisma
   model MyModel {
     id    String @id @default(cuid())
     name  String
   }
   ```

2. **Generate client**:
   ```bash
   npx prisma generate
   ```

3. **Push to database**:
   ```bash
   npx prisma db push
   ```

4. **Use in code**:
   ```typescript
   import { prisma } from '@/lib/prisma';
   
   const items = await prisma.myModel.findMany();
   ```

### Adding a New Page

1. **Create page file**:
   ```bash
   mkdir -p app/my-page
   touch app/my-page/page.tsx
   ```

2. **Implement component**:
   ```typescript
   export default function MyPage() {
     return <div>My Page</div>;
   }
   ```

3. **Add navigation**:
   ```typescript
   <Link href="/my-page">My Page</Link>
   ```

### Debugging

**Server-side**:
```typescript
console.log('Debug:', data);  // Shows in terminal
```

**Client-side**:
```typescript
console.log('Debug:', data);  // Shows in browser console
```

**Database queries**:
```typescript
// Enable query logging
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});
```

**React Query**:
```typescript
// Install devtools
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<ReactQueryDevtools initialIsOpen={false} />
```

## Best Practices

### 1. Error Handling
```typescript
// ✅ Good: Handle errors gracefully
try {
  const data = await fetchData();
  return NextResponse.json({ data });
} catch (error) {
  console.error('Error:', error);
  return NextResponse.json(
    { error: 'Failed to fetch data' },
    { status: 500 }
  );
}

// ❌ Bad: Let errors crash the app
const data = await fetchData();
return NextResponse.json({ data });
```

### 2. Type Safety
```typescript
// ✅ Good: Use proper types
interface Story {
  id: number;
  title: string;
}

function displayStory(story: Story) {
  console.log(story.title);
}

// ❌ Bad: Use 'any'
function displayStory(story: any) {
  console.log(story.title);
}
```

### 3. React Query Keys
```typescript
// ✅ Good: Descriptive, hierarchical keys
queryKey: ['stories', 'top', { limit: 30 }]
queryKey: ['story', storyId]
queryKey: ['comments', storyId, { page: 1 }]

// ❌ Bad: Generic or inconsistent keys
queryKey: ['data']
queryKey: [storyId]
```

### 4. Component Size
```typescript
// ✅ Good: Small, focused components
function StoryCard({ story }) { ... }
function StoryList({ stories }) {
  return stories.map(story => <StoryCard key={story.id} story={story} />);
}

// ❌ Bad: Large, monolithic components
function StoryPage() {
  // 500 lines of code...
}
```

### 5. Comments
```typescript
// ✅ Good: Explain WHY, not WHAT
// Debounce search to avoid excessive API calls
const debouncedSearch = useDebounce(search, 300);

// ❌ Bad: State the obvious
// Set the search value
setSearch(value);
```

## Testing

### Manual Testing Checklist
- [ ] Story list loads (top/new/best)
- [ ] Story detail page shows comments
- [ ] Bookmark add/remove works
- [ ] Bookmark search works
- [ ] AI summary generates correctly
- [ ] Pagination works
- [ ] Mobile responsive

### Database Testing
```bash
# Open Prisma Studio
npx prisma studio

# Run raw SQL
docker exec -it hn-mysql mysql -u root -prootpassword hackernews
```

## Deployment Checklist

- [ ] Update environment variables
- [ ] Test Docker build: `docker-compose up --build`
- [ ] Check database migrations
- [ ] Verify API keys are valid
- [ ] Test production build: `npm run build && npm start`
- [ ] Check error logging
- [ ] Monitor performance
- [ ] Set up backups

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [React Query Docs](https://tanstack.com/query/latest)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Hacker News API](https://github.com/HackerNews/API)
- [Mistral AI Docs](https://docs.mistral.ai/)

## Getting Help

- Check inline code comments
- Read error messages carefully
- Search GitHub issues
- Ask in team chat
- Review similar code in the project

---

Happy coding! 🚀
