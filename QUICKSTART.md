# Quick Start Guide

## Option 1: Docker (Recommended)

1. Create `.env` file:
```bash
echo 'OPENAI_API_KEY="your-key-here"' > .env
```

2. Start everything:
```bash
docker-compose up
```

3. Open http://localhost:3000

## Option 2: Local Development with MySQL

1. Make sure MySQL is running (default: root user, no password)

2. Create `.env`:
```bash
echo 'DATABASE_URL="mysql://root:@localhost:3306/hackernews"' > .env
echo 'OPENAI_API_KEY="your-key-here"' >> .env
```

3. Install dependencies:
```bash
npm install
```

4. Create database and tables:
```bash
npx prisma db push
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

### MySQL connection error
```bash
# Make sure MySQL is running
# Default: root user, no password
# Database: hackernews (auto-created)
```

### Port 3000 already in use
```bash
# Change port in docker-compose.yml or use different port
npm run dev -- -p 3001
```

### Database sync error
```bash
# Regenerate Prisma client and sync schema
npx prisma generate
npx prisma db push
```

### Prisma errors
```bash
# Regenerate Prisma client
npx prisma generate
```
