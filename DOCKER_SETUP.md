# Docker Setup Guide

This guide explains how to run the Hacker News Reader application using Docker.

## Prerequisites

- Docker Desktop installed ([Download here](https://www.docker.com/products/docker-desktop))
- Docker Compose (included with Docker Desktop)
- Mistral AI API key (optional, a default key is provided for testing)

## Quick Start

1. **Clone the repository** (if you haven't already):
   ```bash
   cd hacker-news-reader
   ```

2. **Set up environment variables** (optional):
   
   Create a `.env` file in the project root or use the existing one:
   ```bash
   # Mistral AI API key (optional - a default is provided)
   MISTRAL_API_KEY=your_mistral_api_key_here
   ```

3. **Start the application**:
   ```bash
   docker-compose up
   ```

   This command will:
   - Pull the MySQL 8.0 image
   - Build the Next.js application image
   - Start both containers
   - Create the database schema automatically
   - Make the app available at http://localhost:3000

4. **Access the application**:
   - Open your browser and go to http://localhost:3000
   - The MySQL database is accessible at localhost:3306 (for debugging)

## Docker Commands

### Start the application
```bash
docker-compose up
```

### Start in detached mode (background)
```bash
docker-compose up -d
```

### Stop the application
```bash
docker-compose down
```

### Stop and remove all data (including database)
```bash
docker-compose down -v
```

### Rebuild the application (after code changes)
```bash
docker-compose up --build
```

### View logs
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs app
docker-compose logs mysql

# Follow logs in real-time
docker-compose logs -f app
```

### Access container shell
```bash
# App container
docker exec -it hn-app sh

# MySQL container
docker exec -it hn-mysql mysql -u root -prootpassword hackernews
```

## Architecture

### Services

1. **mysql** (Port 3306)
   - MySQL 8.0 database
   - Stores bookmarks and AI summaries
   - Data persists in a Docker volume

2. **app** (Port 3000)
   - Next.js 16 application
   - Prisma ORM with MySQL adapter
   - Mistral AI integration for summaries

### Volumes

- `mysql_data`: Persistent storage for MySQL database

### Network

- Both services run on the same Docker network
- The app connects to MySQL using the service name `mysql` as hostname

## Environment Variables

The following environment variables are configured in `docker-compose.yml`:

### Database Configuration
- `DATABASE_URL`: Full MySQL connection string
- `DATABASE_USER`: MySQL username
- `DATABASE_PASSWORD`: MySQL password
- `DATABASE_NAME`: Database name
- `DATABASE_HOST`: MySQL hostname (service name)
- `DATABASE_PORT`: MySQL port

### AI Configuration
- `MISTRAL_API_KEY`: API key for Mistral AI (for discussion summaries)

## Troubleshooting

### Port already in use
If port 3000 or 3306 is already in use, you can change the ports in `docker-compose.yml`:

```yaml
ports:
  - "3001:3000"  # Change host port to 3001
```

### Database connection issues
1. Check if MySQL is healthy:
   ```bash
   docker-compose ps
   ```

2. View MySQL logs:
   ```bash
   docker-compose logs mysql
   ```

3. Verify database schema:
   ```bash
   docker exec -it hn-mysql mysql -u root -prootpassword -e "USE hackernews; SHOW TABLES;"
   ```

### Application not starting
1. Check application logs:
   ```bash
   docker-compose logs app
   ```

2. Rebuild the image:
   ```bash
   docker-compose up --build
   ```

3. Clear all containers and volumes:
   ```bash
   docker-compose down -v
   docker-compose up --build
   ```

### Prisma schema changes
After modifying `prisma/schema.prisma`:

1. Rebuild and restart:
   ```bash
   docker-compose down
   docker-compose up --build
   ```

The schema will be automatically pushed to the database on startup.

## Development vs Production

### Development (Current Setup)
- Uses empty root password for MySQL (not secure)
- Exposes MySQL port for debugging
- Includes source maps and dev tools

### Production Recommendations
1. Use strong passwords for MySQL
2. Don't expose MySQL port externally
3. Use environment variables from a secure source
4. Enable HTTPS/SSL
5. Use a managed database service (AWS RDS, Google Cloud SQL, etc.)
6. Set up proper logging and monitoring

## Data Persistence

Database data is stored in a Docker volume named `mysql_data`. This means:
- Data persists when you stop/restart containers
- Data is lost only when you run `docker-compose down -v`
- You can backup the volume using Docker commands

### Backup Database
```bash
docker exec hn-mysql mysqldump -u root -prootpassword hackernews > backup.sql
```

### Restore Database
```bash
docker exec -i hn-mysql mysql -u root -prootpassword hackernews < backup.sql
```

## Performance Optimization

### Build Cache
Docker caches layers to speed up builds. To maximize cache efficiency:
- Don't modify `package.json` unless necessary
- Use `.dockerignore` to exclude unnecessary files

### Resource Limits
You can limit container resources in `docker-compose.yml`:

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
```

## Next Steps

- Read the main [README.md](./README.md) for application features
- Check [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) for architecture details
- Review [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues
