# Docker Setup Verification Checklist

Use this checklist to verify your Docker setup is correct before running the application.

---

## Pre-Flight Checklist

### ✅ 1. Docker Desktop is Running

**Check:**
- Windows: Look for Docker icon in system tray (bottom-right)
- Mac: Look for Docker icon in menu bar (top-right)
- Linux: Run `docker --version` in terminal

**Expected:** Docker version 20.10+ or higher

---

### ✅ 2. Repository is Cloned

```bash
git clone <repo-url>
cd hacker-news-reader
```

**Verify you're in the right directory:**
```bash
ls -la
```

**Expected files:**
- `Dockerfile`
- `docker-compose.yml`
- `.env.docker.example`
- `.env.example`
- `package.json`

---

### ✅ 3. `.env` File Exists

**Check:**
```bash
ls -la .env
```

**If missing, create it:**
```bash
cp .env.docker.example .env
```

**Verify content:**
```bash
cat .env
```

**Expected:**
```env
MISTRAL_API_KEY=your_mistral_api_key_here
```

---

### ✅ 4. Mistral API Key is Set

**Open `.env` and verify:**
- The value is NOT `your_mistral_api_key_here`
- The value is a real API key (starts with letters/numbers)
- No extra spaces or quotes around the key

**Example of correct `.env`:**
```env
MISTRAL_API_KEY=dzUQnfjmbH9WMp1NwGc47pkArE76cxyi
```

---

### ✅ 5. No Port Conflicts

**Check if port 3000 is free:**
```bash
# Windows (PowerShell)
netstat -ano | findstr :3000

# Mac/Linux
lsof -i :3000
```

**Expected:** No output (port is free)

**If port is in use:**
- Stop the application using it
- Or change the port in `docker-compose.yml`: `"3001:3000"`

**Check if port 3306 is free:**
```bash
# Windows (PowerShell)
netstat -ano | findstr :3306

# Mac/Linux
lsof -i :3306
```

**Expected:** No output (port is free)

**If port is in use (local MySQL running):**
- Stop local MySQL
- Or change the port in `docker-compose.yml`: `"3307:3306"`

---

### ✅ 6. `.gitignore` is Correct

**Verify `.env` will NOT be committed:**
```bash
git status
```

**Expected:** `.env` should NOT appear in the list

**If `.env` appears:**
```bash
git rm --cached .env
git add .gitignore
```

---

## Build and Run

### Step 1: Build the Images

```bash
docker-compose build
```

**Expected output:**
```
[+] Building 120.5s (18/18) FINISHED
 => [base 1/2] FROM docker.io/library/node:20-alpine
 => [deps 2/3] COPY package*.json ./
 => [deps 3/3] RUN npm ci
 => [builder 3/4] RUN npx prisma generate
 => [builder 4/4] RUN npm run build
 => [runner 3/3] COPY --from=builder ...
 => => naming to docker.io/library/hacker-news-reader-app
```

**If build fails:**
- Check error message
- Ensure `package.json` exists
- Ensure `Dockerfile` is not corrupted

---

### Step 2: Start the Services

```bash
docker-compose up
```

**Expected output (in order):**

1. **MySQL starts:**
```
hn-mysql  | MySQL init process done. Ready for start up.
hn-mysql  | ready for connections. Version: '8.0.x'
```

2. **Health check passes:**
```
hn-mysql  | mysqladmin ping succeeded
```

3. **App starts and pushes schema:**
```
hn-app    | Prisma schema loaded from prisma/schema.prisma
hn-app    | Datasource "db": MySQL database "hackernews" at "mysql:3306"
hn-app    | 
hn-app    | ✓ Your database is now in sync with your Prisma schema
```

4. **Next.js server starts:**
```
hn-app    |   ▲ Next.js 15.x.x
hn-app    |   - Local:        http://0.0.0.0:3000
hn-app    | 
hn-app    | ✓ Ready in 1.2s
```

---

### Step 3: Verify the Application

**Open browser:**
```
http://localhost:3000
```

**Expected:**
- Page loads successfully
- You see "Hacker News Reader" title
- Story list appears (top/new/best tabs)
- No console errors

**Test features:**
1. Click a story title → opens HN link in new tab
2. Click "View Discussion" → opens story detail page
3. Click bookmark icon → story is bookmarked
4. Click "Bookmarks" in nav → see bookmarked stories
5. Click "Summarize Discussion" → AI summary appears (takes 5-10 seconds)

---

## Troubleshooting

### Build fails with "npm ci" error

**Cause:** `package-lock.json` is corrupted or missing

**Fix:**
```bash
rm -rf node_modules package-lock.json
npm install
git add package-lock.json
docker-compose build
```

---

### "Cannot connect to MySQL"

**Cause:** MySQL container is not healthy yet

**Fix:** Wait 30 seconds and check logs:
```bash
docker-compose logs mysql
```

Look for "ready for connections"

---

### "Prisma db push failed"

**Cause:** DATABASE_URL is not set correctly

**Fix:** Check `docker-compose.yml` environment section:
```yaml
environment:
  - DATABASE_URL=mysql://hackernews_user:hackernews_pass@mysql:3306/hackernews
```

Restart:
```bash
docker-compose down
docker-compose up
```

---

### "MISTRAL_API_KEY is not set"

**Cause:** `.env` file is missing or empty

**Fix:**
```bash
cp .env.docker.example .env
# Edit .env and add your API key
docker-compose down
docker-compose up
```

---

### Page loads but no stories appear

**Cause:** Hacker News API is down or rate-limited

**Fix:** Wait a few minutes and refresh. Check browser console for errors.

---

### "Port 3000 is already allocated"

**Cause:** Another container or app is using port 3000

**Fix:**

**Option 1 — Stop the other app:**
```bash
docker ps
docker stop <container-id>
```

**Option 2 — Change the port:**

Edit `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # Changed from 3000:3000
```

Then access at http://localhost:3001

---

## Clean Slate (Nuclear Option)

If everything is broken, start fresh:

```bash
# Stop and remove everything
docker-compose down -v

# Remove all images
docker-compose rm -f

# Rebuild from scratch
docker-compose build --no-cache

# Start fresh
docker-compose up
```

---

## Success Criteria

✅ Docker Desktop is running  
✅ `.env` file exists with valid Mistral API key  
✅ `docker-compose up` completes without errors  
✅ MySQL container shows "ready for connections"  
✅ App container shows "Your database is now in sync"  
✅ App container shows "Ready in X.Xs"  
✅ http://localhost:3000 loads successfully  
✅ Story list appears  
✅ Bookmarking works  
✅ AI summarization works  

**If all criteria pass, your Docker setup is perfect! 🎉**
