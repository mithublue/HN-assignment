#!/bin/bash

echo "🚀 Setting up Smart Hacker News Reader..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Please create a .env file with your OPENAI_API_KEY"
    echo ""
    echo "Example:"
    echo "DATABASE_URL=\"postgresql://postgres:postgres@localhost:5432/hackernews?schema=public\""
    echo "OPENAI_API_KEY=\"your-openai-api-key-here\""
    exit 1
fi

echo "✅ .env file found"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

echo "✅ Docker is running"

# Start services
echo "🐳 Starting Docker containers..."
docker-compose up -d postgres

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

# Run migrations
echo "📦 Running database migrations..."
npm run db:push

echo ""
echo "✅ Setup complete!"
echo ""
echo "🎉 You can now start the application:"
echo "   npm run dev (for development)"
echo "   or"
echo "   docker-compose up (for production)"
echo ""
echo "📱 The app will be available at http://localhost:3000"
