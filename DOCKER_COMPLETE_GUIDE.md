# Complete Docker Setup Guide

This guide walks you through running the Hacker News Reader using Docker from scratch.

---

## Prerequisites

1. **Docker Desktop** installed and running
   - Download: https://www.docker.com/products/docker-desktop/
   - After installation, make sure Docker Desktop is running (check system tray/menu bar)

2. **Git** (to clone the repository)

3. **A Mistral AI API key**
   - Sign up at https://console.mistral.ai/
   - Create a new API key (free tier available)

---

## Step-by-Step Setup

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd hacker-news-reader
```

### Step 2: Create Your Environment File

The repository does NOT include a `.env` file (it's gitignored for security). You need to create it:

```bash
cp .env.docker.example .env
```

This creates a `.env` file with this content:
```env
MISTRAL_API_KEY=your_mistral_api_key_here
```

### Step 3: Add Your Mistral API Key

Open the `.env` file in any text editor and replace `your_mistral_api_key_here` with your actual API key:

```env
MISTRAL_API_KEY=dzUQnfjmbH9WMp1NwGc47pkArE76cxyi
```

**Important:** This `.env` file will NEVER be committed to GitHub (it's in `.gitignore`).

### Step 4: Start Docker Compose

```bash
docker-compose up --build
```

**What happens:**
1. Docker pulls the MySQL 8.0 image (if not already downloaded)
2. Docker builds the Next.js application image (~2-3 minutes first time)
3. MySQL container starts and initializes the database
4. Docker waits for MySQL to be healthy (health check)
5. App container starts and runs `prisma db push` to create tables
6. Next.js production server starts

**You'll see output like:**
```
hn-mysql  | ready for connections
hn-app    | ✓ Your database is now in sync with your Prisma schema
hn-app    | Ready on http://0.0.0.0:3000
```

### Step 5: Open the Application

Open your browser to:
```
http://localhost:3000
```

---

## Understanding the Docker Setup

### What's in `.env.docker.example`?

```env
MISTRAL_API_KEY=your_mistral_api_key_here
```

**Only 1 variable!** Why? Because all database credentials are hardcoded in `docker-compose.yml`. Docker creates its own MySQL container with known credentials, so you don't need to configure them.

### What's in `.env.example`?

```env
DATABASE_URL="mysql://root:@localhost:3306/hackernews"
DATABASE_USER="root"
DATABASE_PASSWORD=""
DATABASE_NAME="hackernews"
DATABASE_HOST="localhost"
DATABASE_PORT=3306
MISTRAL_API_KEY="your_mistral_api_key_here"
```

**7 variables!** This is for LOCAL development (without Docker), where you need to connect to your own MySQL instance.

### What's in `docker-compose.yml`?

All database configuration is defined here:

```yaml
environment:
  - DATABASE_URL=mysql://hackernews_user:hackernews_pass@mysql:3306/hackernews
  - DATABASE_USER=hackernews_user
  - DATABASE_PASSWORD=hackernews_pass
  - DATABASE_NAME=hackernews
  - DATABASE_HOST=mysql
  - DATABASE_PORT=3306
  - MISTRAL_API_KEY=${MISTRAL_API_KEY}  # ← reads from your .env file
```

The `${MISTRAL_API_KEY}` syntax tells Docker Compose to read that value from your `.env` file.

---

## Common Commands

### Start the application
```bash
docker-compose up
```

### Start with rebuild (after code changes)
```bash
docker-compose up --build
```

### Start in background (detached mode)
```bash
docker-compose up -d
```

### Stop the application
```bash
docker-compose down
```

### Stop and remove database (fresh start)
```bash
docker-compose down -v
```

### View logs
```bash
docker-compose logs -f
```

### View logs for specific service
```bash
docker-compose logs -f app
docker-compose logs -f mysql
```

---

## Troubleshooting

### "Cannot connect to the Docker daemon"
- Make sure Docker Desktop is running
- On Windows: check system tray for Docker icon
- On Mac: check menu bar for Docker icon

### "Port 3306 is already in use"
- You have MySQL running locally
- Stop local MySQL: `sudo service mysql stop` (Linux) or stop via Services (Windows)
- Or change the port in `docker-compose.yml`: `"3307:3306"`

### "Port 3000 is already in use"
- Another app is using port 3000
- Stop that app or change the port in `docker-compose.yml`: `"3001:3000"`

### "MISTRAL_API_KEY is not set"
- Make sure you created the `.env` file: `cp .env.docker.example .env`
- Make sure you added your actual API key to `.env`
- Restart docker-compose: `docker-compose down && docker-compose up`

### Database tables not created
- Check logs: `docker-compose logs app`
- Look for "Your database is now in sync with your Prisma schema"
- If missing, the `prisma db push` command failed
- Try rebuilding: `docker-compose down -v && docker-compose up --build`

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     Docker Compose                       │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────────┐         ┌─────────────────┐       │
│  │   MySQL 8.0     │         │   Next.js App   │       │
│  │   Container     │◄────────│   Container     │       │
│  │                 │         │                 │       │
│  │ Port: 3306      │         │ Port: 3000      │       │
│  │ User: hackernews│         │                 │       │
│  │ Pass: hackernews│         │ Reads:          │       │
│  │ DB: hackernews  │         │ - DATABASE_URL  │       │
│  │                 │         │ - MISTRAL_API_KEY│      │
│  └─────────────────┘         └─────────────────┘       │
│         │                            │                  │
│         │                            │                  │
│    Persistent                   Stateless               │
│    Volume                       (rebuilt)               │
│    (mysql_data)                                         │
│                                                          │
└──────────────────────────────────────────────────────────┘
                         │
                         │ Reads MISTRAL_API_KEY
                         ▼
                    .env file
                (not in GitHub)
```

---

## Security Notes

1. **`.env` is gitignored** — Your API key will never be committed to GitHub
2. **Database credentials are hardcoded in `docker-compose.yml`** — This is safe because:
   - The MySQL container is only accessible within the Docker network
   - Port 3306 is exposed to localhost for debugging, but not to the internet
   - These are development credentials, not production secrets
3. **For production** — Use Docker secrets or environment variable injection from your hosting platform

---

## Next Steps

- Read the main [README.md](./README.md) for architecture details
- Check [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) for code structure
- See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues
