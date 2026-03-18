# Smart Hacker News Reader

A modern, full-stack Hacker News client with AI-powered discussion summaries, built with Next.js 16, Prisma 7, and Mistral AI.

## Features

### Core Functionality
- **Story Browsing**: View top, new, and best stories from Hacker News
- **Nested Comments**: Full comment threads with unlimited nesting depth
- **Bookmarking System**: Save stories for later with search functionality
- **AI Summaries**: Get AI-generated summaries of discussion threads with sentiment analysis

### Technical Highlights
- **Modern Stack**: Next.js 16 with App Router, React 19, TypeScript
- **Type-Safe Database**: Prisma 7 ORM with MySQL adapter
- **Real-time Updates**: React Query for optimized data fetching and caching
- **Responsive Design**: Tailwind CSS 4 for mobile-first UI
- **Docker Support**: One-command deployment with Docker Compose
- **Production Ready**: Optimized builds, error handling, and logging

## Quick Start

### Option 1: Docker (Recommended)

The easiest way to run the application:

```bash
# Start everything with one command
docker-compose up

# Access the app at http://localhost:3000
```

That's it! Docker will:
- Set up MySQL database
- Install dependencies
- Build the application
- Create database schema
- Start the server

For detailed Docker instructions, see [DOCKER_SETUP.md](./DOCKER_SETUP.md).

### Option 2: Local Development

#### Prerequisites
- Node.js 20+ and npm
- MySQL 8.0+ running locally
- Mistral AI API key (optional, a default is provided)

#### Setup Steps

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   
   Create or update `.env` file:
   ```env
   # Database Configuration
   DATABASE_URL="mysql://root:@localhost:3306/hackernews"
   DATABASE_USER="root"
   DATABASE_PASSWORD=""
   DATABASE_NAME="hackernews"
   DATABASE_HOST="localhost"
   DATABASE_PORT=3306

   # AI Configuration
   MISTRAL_API_KEY="your_mistral_api_key_here"
   ```

3. **Set up database**:
   ```bash
   # Generate Prisma client
   npx prisma generate

   # Create database schema
   npx prisma db push
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

5. **Open browser**:
   ```
   http://localhost:3000
   ```

## Project Structure

```
hacker-news-reader/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── bookmarks/            # Bookmark CRUD operations
│   │   ├── comments/             # Comment fetching with nesting
│   │   ├── stories/              # Story list and details
│   │   └── summarize/            # AI summary generation
│   ├── bookmarks/                # Bookmarks page
│   ├── story/[id]/               # Story detail page
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page (story list)
│   └── providers.tsx             # React Query provider
├── lib/                          # Shared utilities
│   ├── hn-api.ts                 # Hacker News API client
│   ├── openai.ts                 # Mistral AI integration
│   ├── prisma.ts                 # Database client
│   └── types.ts                  # TypeScript types
├── prisma/                       # Database schema
│   ├── schema.prisma             # Prisma schema definition
│   └── migrations/               # Database migrations
├── generated/                    # Generated Prisma client
├── public/                       # Static assets
├── Dockerfile                    # Docker image definition
├── docker-compose.yml            # Docker services configuration
├── next.config.ts                # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json                  # Dependencies and scripts
```

## Architecture

### Frontend
- **Framework**: Next.js 16 with App Router (React Server Components)
- **State Management**: React Query (TanStack Query) for server state
- **Styling**: Tailwind CSS 4 with custom design system
- **Type Safety**: TypeScript with strict mode

### Backend
- **API**: Next.js API Routes (serverless functions)
- **Database**: MySQL 8.0 with Prisma 7 ORM
- **AI**: Mistral AI (`mistral-small-latest` model)
- **Validation**: Zod for request validation

### Data Flow
1. User requests data → React Query
2. React Query checks cache → If stale, fetch from API
3. API route validates request → Calls HN API or Database
4. Response cached by React Query → UI updates

### Database Schema

```prisma
model Bookmark {
  id           String   @id @default(cuid())
  storyId      Int      @unique
  title        String
  url          String?
  author       String
  points       Int
  commentCount Int
  createdAt    DateTime @default(now())
}

model Summary {
  id        String   @id @default(cuid())
  storyId   Int      @unique
  keyPoints Json     // Array of key discussion points
  sentiment String   // positive, negative, mixed, neutral
  summary   String   @db.Text
  createdAt DateTime @default(now())
}
```

## API Endpoints

### Stories
- `GET /api/stories?type=top&limit=30` - Get story list
- `GET /api/stories/[id]` - Get single story

### Comments
- `GET /api/comments/[id]?page=1` - Get paginated comments with full nesting

### Bookmarks
- `GET /api/bookmarks?search=query` - List bookmarks with search
- `POST /api/bookmarks` - Create bookmark
- `GET /api/bookmarks/[id]` - Get bookmark by story ID
- `DELETE /api/bookmarks/[id]` - Delete bookmark

### AI Summaries
- `GET /api/summarize/[id]` - Get existing summary
- `POST /api/summarize/[id]` - Generate new summary

## Development

### Available Scripts

```bash
# Development
npm run dev          # Start dev server with hot reload

# Building
npm run build        # Create production build
npm run start        # Start production server

# Database
npm run db:push      # Push schema changes to database
npm run db:studio    # Open Prisma Studio (database GUI)
npm run db:migrate   # Create and run migrations

# Code Quality
npm run lint         # Run ESLint
```

### Adding New Features

1. **Database Changes**:
   - Update `prisma/schema.prisma`
   - Run `npx prisma generate`
   - Run `npx prisma db push`

2. **API Routes**:
   - Create file in `app/api/[route]/route.ts`
   - Export `GET`, `POST`, `PUT`, `DELETE` functions
   - Use Zod for validation

3. **UI Components**:
   - Create component in `app/[page]/`
   - Use React Query for data fetching
   - Follow existing patterns for consistency

### Code Style

- **TypeScript**: Strict mode enabled, no `any` types
- **React**: Functional components with hooks
- **Async**: Use `async/await` over promises
- **Error Handling**: Always handle errors gracefully
- **Comments**: Document complex logic and public APIs

## Deployment

### Docker Deployment (Recommended)

```bash
# Production build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Manual Deployment

1. Set environment variables on your hosting platform
2. Run build: `npm run build`
3. Start server: `npm run start`
4. Ensure MySQL is accessible

### Hosting Options
- **Vercel**: Best for Next.js (requires external MySQL)
- **Railway**: Includes database hosting
- **AWS/GCP/Azure**: Full control with Docker
- **DigitalOcean**: App Platform or Droplet with Docker

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | Full MySQL connection string | - | Yes |
| `DATABASE_USER` | MySQL username | `root` | Yes |
| `DATABASE_PASSWORD` | MySQL password | `` | Yes |
| `DATABASE_NAME` | Database name | `hackernews` | Yes |
| `DATABASE_HOST` | MySQL hostname | `localhost` | Yes |
| `DATABASE_PORT` | MySQL port | `3306` | Yes |
| `MISTRAL_API_KEY` | Mistral AI API key | Provided | Yes |
| `NODE_ENV` | Environment | `development` | No |

## Troubleshooting

### Common Issues

**Port already in use**:
```bash
# Kill process on port 3000
npx kill-port 3000
```

**Database connection failed**:
- Check MySQL is running
- Verify credentials in `.env`
- Ensure database exists

**Prisma client not found**:
```bash
npx prisma generate
```

**Build errors**:
```bash
# Clean and rebuild
rm -rf .next node_modules
npm install
npm run build
```

For more issues, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).

## Performance

### Optimizations Implemented
- React Query caching (5-minute stale time for stories)
- Prisma connection pooling (5 connections)
- Next.js image optimization
- Comment pagination (20 per page)
- Debounced search (300ms)
- Lazy loading for nested comments

### Monitoring
- Server logs via `docker-compose logs`
- React Query DevTools (development only)
- Prisma query logging (development only)

## Security

### Implemented Measures
- Input validation with Zod
- SQL injection prevention (Prisma ORM)
- XSS protection (React escaping)
- CORS configuration
- Environment variable protection
- Non-root Docker user

### Production Recommendations
- Use strong database passwords
- Enable HTTPS/SSL
- Implement rate limiting
- Add authentication if needed
- Regular security updates
- Monitor for vulnerabilities

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - feel free to use this project for learning or commercial purposes.

## Support

- **Issues**: Open a GitHub issue
- **Documentation**: See `/docs` folder
- **API Docs**: See inline code comments

## Acknowledgments

- [Hacker News API](https://github.com/HackerNews/API)
- [Next.js](https://nextjs.org/)
- [Prisma](https://www.prisma.io/)
- [Mistral AI](https://mistral.ai/)
- [Tailwind CSS](https://tailwindcss.com/)

---

Built with ❤️ using modern web technologies
