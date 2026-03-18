# Docker Quick Start

Get the Hacker News Reader running in under 2 minutes!

## Prerequisites

- Docker Desktop installed and running
- That's it! No Node.js, MySQL, or other dependencies needed.

## Start the Application

```bash
# Navigate to project directory
cd hacker-news-reader

# Start everything
docker-compose up
```

Wait for the output to show:
```
hn-app    | ✓ Ready in 2.5s
hn-app    | - Local:        http://localhost:3000
```

## Access the Application

Open your browser and go to:
```
http://localhost:3000
```

## Stop the Application

Press `Ctrl+C` in the terminal, then:
```bash
docker-compose down
```

## Common Commands

```bash
# Start in background (detached mode)
docker-compose up -d

# View logs
docker-compose logs -f app

# Restart after code changes
docker-compose up --build

# Stop and remove everything (including database)
docker-compose down -v

# Check status
docker-compose ps
```

## What's Running?

- **App**: http://localhost:3000 (Next.js application)
- **MySQL**: localhost:3306 (database)

## Troubleshooting

**Port 3000 already in use?**
```bash
# Kill the process
npx kill-port 3000
# Or change the port in docker-compose.yml
```

**Database issues?**
```bash
# Reset everything
docker-compose down -v
docker-compose up --build
```

**Still having issues?**
See [DOCKER_SETUP.md](./DOCKER_SETUP.md) for detailed troubleshooting.

## Next Steps

- Read [README.md](./README.md) for features and architecture
- Check [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) to start coding
- Review [DOCKER_SETUP.md](./DOCKER_SETUP.md) for advanced Docker usage

---

That's it! You're ready to explore the application. 🎉
