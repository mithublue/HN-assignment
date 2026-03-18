# Docker Quick Start (5 Minutes)

Get the Hacker News Reader running with Docker in 5 simple steps.

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- A [Mistral AI API key](https://console.mistral.ai/) (free tier available)

---

## 5 Steps to Run

### 1️⃣ Clone the repo
```bash
git clone <repo-url>
cd hacker-news-reader
```

### 2️⃣ Create `.env` file
```bash
cp .env.docker.example .env
```

### 3️⃣ Add your API key
Open `.env` and replace the placeholder:
```env
MISTRAL_API_KEY=your_actual_mistral_key_here
```

### 4️⃣ Start Docker
```bash
docker-compose up
```

Docker pulls the pre-built image from Docker Hub. No build step needed.

### 5️⃣ Open the app
```
http://localhost:3000
```

---

## That's It!

The app is now running with:
- MySQL database (port 3306)
- Next.js app (port 3000)
- Automatic schema setup
- Persistent data storage

---

## Common Commands

**Stop:**
```bash
docker-compose down
```

**Restart:**
```bash
docker-compose up
```

**Rebuild after code changes:**
```bash
docker-compose up --build
```

**Fresh start (wipe database):**
```bash
docker-compose down -v
docker-compose up --build
```

---

## Need Help?

- **Detailed guide:** [DOCKER_COMPLETE_GUIDE.md](./DOCKER_COMPLETE_GUIDE.md)
- **Troubleshooting:** [DOCKER_VERIFICATION.md](./DOCKER_VERIFICATION.md)
- **Architecture:** [README.md](./README.md)
