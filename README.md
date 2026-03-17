# Smart Hacker News Reader

A Hacker News client with AI-powered discussion summaries built with Next.js, PostgreSQL, and OpenAI.

## Features

- 📰 Browse Hacker News stories (Top, New, Best)
- 💬 View threaded comment discussions
- 🔖 Bookmark stories for later reading
- 🔍 Search through your bookmarks
- 🤖 AI-powered discussion summaries with:
  - Key points extraction
  - Sentiment analysis
  - Concise summary generation

## Tech Stack

- **Frontend & Backend**: Next.js 14+ (App Router, TypeScript)
- **Database**: PostgreSQL with Prisma ORM
- **AI**: Mistral AI (mistral-small-latest)
- **Data Fetching**: TanStack React Query
- **Styling**: Tailwind CSS
- **Deployment**: Docker Compose

## Quick Start

### Prerequisites

- Docker and Docker Compose (for containerized setup)
- MySQL 8.0+ (for local development)
- OpenAI API key (get one at https://platform.openai.com/)

### Setup with Local MySQL

1. Clone the repository:
```bash
git clone <your-repo-url>
cd hacker-news-reader
```

2. Create a `.env` file:
```env
DATABASE_URL="mysql://root:@localhost:3306/hackernews"
OPENAI_API_KEY="your-openai-api-key-here"
```

3. Create the database and tables:
```bash
npx prisma db push
```

4. Install dependencies:
```bash
npm install
```

5. Start the development server:
```bash
npm run dev
```

The application will be available at http://localhost:3000

### Setup with Docker

1. Create a `.env` file with your OpenAI API key:
```env
OPENAI_API_KEY="your-openai-api-key-here"
```

2. Start everything:
```bash
docker-compose up
```

The application will be available at http://localhost:3000

## Architecture Decisions

### Why Next.js Full-Stack?

- **Single Codebase**: Combines frontend and backend in one application
- **API Routes**: Built-in API endpoints eliminate need for separate Express/NestJS server
- **Server Components**: Improved performance with React Server Components
- **Type Safety**: End-to-end TypeScript from database to UI

### Why PostgreSQL?

- **Relational Data**: Perfect for bookmarks and summaries with clear relationships
- **Full-Text Search**: Native support for searching bookmarks
- **Reliability**: Production-ready with ACID compliance
- **Docker Support**: Easy to containerize and deploy

### Why Prisma?

- **Type-Safe**: Auto-generated TypeScript types from schema
- **Migrations**: Database schema versioning and migrations
- **Developer Experience**: Intuitive API and excellent tooling

### Why OpenAI GPT-4o-mini?

- **Cost-Effective**: Cheaper than GPT-4 while maintaining quality
- **Fast**: Quick response times for summaries
- **JSON Mode**: Structured output for consistent parsing
- **Reliable**: Production-ready API with good uptime

## API Endpoints

### Stories
- `GET /api/stories?type=top&limit=30` - Get stories by type
- `GET /api/stories/[id]` - Get single story details

### Comments
- `GET /api/comments/[id]` - Get all comments for a story

### Bookmarks
- `GET /api/bookmarks` - Get all bookmarks
- `GET /api/bookmarks?search=query` - Search bookmarks
- `POST /api/bookmarks` - Create bookmark
- `DELETE /api/bookmarks/[id]` - Delete bookmark
- `GET /api/bookmarks/[id]` - Check if story is bookmarked

### AI Summaries
- `GET /api/summarize/[id]` - Get existing summary
- `POST /api/summarize/[id]` - Generate new summary

## Tradeoffs & Decisions

### What I Prioritized

1. **Simplicity**: Single Next.js app instead of microservices
2. **Functionality**: All core features working end-to-end
3. **User Experience**: Loading states, error handling, responsive design
4. **Docker**: One-command deployment with `docker-compose up`

### What I Simplified

1. **No Authentication**: Single-user application as per requirements
2. **Basic Styling**: Functional and clean, not fancy
3. **Comment Threading**: Flat list instead of nested tree (simpler to implement)
4. **Caching**: Basic React Query caching, no Redis
5. **Pagination**: Limited to first 30 stories (can be extended)

### Known Limitations

1. **AI Summary Speed**: Can take 5-10 seconds for large discussions
2. **Comment Depth**: Fetches all comments sequentially (could be optimized)
3. **No Offline Support**: Requires internet connection
4. **Single AI Provider**: Only OpenAI (could add Anthropic as fallback)

## What I Would Add With More Time

- **Pagination/Infinite Scroll**: Load more stories dynamically
- **Comment Threading UI**: Proper nested comment visualization
- **Summary Caching**: Store summaries to avoid regenerating
- **Multiple AI Providers**: Fallback to Anthropic if OpenAI fails
- **Rate Limiting**: Protect API endpoints from abuse
- **Error Boundaries**: Better error handling in React components
- **Tests**: Unit tests for API routes, integration tests for flows
- **Analytics**: Track which stories get summarized most
- **Export Bookmarks**: Download as JSON/CSV
- **Dark Mode**: Theme toggle for better UX
- **PWA**: Offline support and mobile app feel
- **WebSocket**: Real-time comment updates

## Project Structure

```
hacker-news-reader/
├── app/
│   ├── api/              # API routes
│   │   ├── stories/      # Story endpoints
│   │   ├── comments/     # Comment endpoints
│   │   ├── bookmarks/    # Bookmark endpoints
│   │   └── summarize/    # AI summary endpoints
│   ├── story/[id]/       # Story detail page
│   ├── bookmarks/        # Bookmarks page
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Home page
│   └── providers.tsx     # React Query provider
├── lib/
│   ├── hn-api.ts         # Hacker News API client
│   ├── openai.ts         # OpenAI integration
│   ├── prisma.ts         # Prisma client
│   └── types.ts          # TypeScript types
├── prisma/
│   └── schema.prisma     # Database schema
├── docker-compose.yml    # Docker orchestration
├── Dockerfile            # App container
└── README.md             # This file
```

## Performance Considerations

- **React Query**: Automatic caching and deduplication
- **Prisma**: Connection pooling and optimized queries
- **Next.js**: Automatic code splitting and optimization
- **Docker**: Multi-stage builds for smaller images

## Security Considerations

- **Environment Variables**: API keys stored securely
- **Input Validation**: Zod schemas for API requests
- **SQL Injection**: Prisma prevents SQL injection
- **XSS**: React automatically escapes content
- **CORS**: Next.js API routes are same-origin by default

## License

MIT
