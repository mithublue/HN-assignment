# Troubleshooting Guide

## Bookmark Not Working

### Step 1: Check Database Connection

Visit: `http://localhost:3000/api/health`

You should see:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2026-03-17T..."
}
```

If you see `"database": "disconnected"`, the MySQL connection is failing.

### Step 2: Verify MySQL is Running

```bash
# Check if MySQL is running
mysql -u root -e "SELECT 1"

# If not running, start it (Windows with Laragon)
# Or manually start MySQL service
```

### Step 3: Check Database Exists

```bash
# List databases
mysql -u root -e "SHOW DATABASES;"

# You should see "hackernews" in the list
```

### Step 4: Check Tables Exist

```bash
# List tables in hackernews database
mysql -u root -e "USE hackernews; SHOW TABLES;"

# You should see:
# - bookmark
# - summary
```

### Step 5: Check Browser Console

Open DevTools (F12) → Console tab

Look for errors like:
- `POST /api/bookmarks 500` - Server error
- `POST /api/bookmarks 400` - Invalid data
- Network errors

### Step 6: Check Server Logs

When running `npm run dev`, look for logs like:
```
✅ Database connected
```

or

```
❌ Database connection failed: connect ECONNREFUSED 127.0.0.1:3306
```

## Common Issues

### "Failed to create bookmark"

**Cause**: Database connection issue

**Fix**:
1. Verify MySQL is running: `mysql -u root -e "SELECT 1"`
2. Check DATABASE_URL in `.env`: `mysql://root:@localhost:3306/hackernews`
3. Restart dev server: `npm run dev`

### "Story already bookmarked"

**Cause**: You already bookmarked this story

**Fix**: This is expected behavior. Remove the bookmark first if you want to re-bookmark.

### "Invalid request data"

**Cause**: Missing or wrong data types

**Fix**: Check browser console for validation errors. Make sure all fields are present:
- storyId (number)
- title (string)
- url (string or null)
- author (string)
- points (number)
- commentCount (number)

### Database Tables Not Created

**Cause**: Prisma schema not synced

**Fix**:
```bash
# Regenerate Prisma client
npx prisma generate

# Sync database schema
npx prisma db push

# Verify tables
mysql -u root -e "USE hackernews; SHOW TABLES;"
```

## Reset Everything

If nothing works, reset the database:

```bash
# Drop the database
mysql -u root -e "DROP DATABASE hackernews;"

# Recreate it
npx prisma db push

# Restart dev server
npm run dev
```

## Check Logs

### Server Logs (Terminal)
When running `npm run dev`, you'll see:
- Database connection status
- Bookmark creation logs
- Error messages

### Browser Console (F12)
- Network errors
- API response errors
- Client-side errors

### MySQL Logs
```bash
# Check MySQL error log (if needed)
# Location varies by OS
```

## Still Not Working?

1. **Verify MySQL credentials**: `mysql -u root` (no password)
2. **Check DATABASE_URL**: Should be `mysql://root:@localhost:3306/hackernews`
3. **Restart everything**:
   ```bash
   # Stop dev server (Ctrl+C)
   # Restart MySQL
   # Run: npm run dev
   ```
4. **Check for port conflicts**: Is port 3306 (MySQL) already in use?
