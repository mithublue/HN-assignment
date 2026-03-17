# Quick Start Guide

## Option 1: Docker (Recommended)

1. Create `.env` file:
```bash
echo 'DATABASE_URL="postgresql://postgres:postgres@postgres:5432/hackernews?schema=public"' > .env
echo 'OPENAI_API_KEY="your-key-here"' >> .env
```

2. Start everything:
```bash
docker-compose up
```

3. Open http://localhost:3000

## Option 2: Local Development

1. Install dependencies:
```bash
npm install
```

2. Start PostgreSQL:
```bash
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=hackernews postgres:16-alpine
```

3. Create `.env`:
```bash
echo 'DATABASE_URL="postgresql://postgres:postgres@localhost:5432/hackernews?schema=public"' > .env
echo 'OPENAI_API_KEY="your-key-here"' >> .env
```

4. Setup database:
```bash
npx prisma db push
npx prisma generate
```

5. Start dev server:
```bash
npm run dev
```

6. Open http://localhost:3000

## Getting an OpenAI API Key

1. Go to https://platform.openai.com/
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy and paste it into your `.env` file

## Troubleshooting

### Port 5432 already in use
```bash
# Stop existing PostgreSQL
docker stop $(docker ps -q --filter ancestor=postgres)
```

### Port 3000 already in use
```bash
# Change port in docker-compose.yml or use different port
npm run dev -- -p 3001
```

### Database connection error
```bash
# Reset database
docker-compose down -v
docker-compose up
```

### Prisma errors
```bash
# Regenerate Prisma client
npx prisma generate
```
