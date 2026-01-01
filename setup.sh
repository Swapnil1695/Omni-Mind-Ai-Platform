#!/bin/bash

# OmniMind Platform Setup Script

echo "🚀 Setting up OmniMind AI Platform..."

# Check for required tools
command -v node >/dev/null 2>&1 || { echo "Node.js is required but not installed. Aborting." >&2; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "Docker is required but not installed. Aborting." >&2; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "Docker Compose is required but not installed. Aborting." >&2; exit 1; }

# Copy environment file
if [ ! -f .env ]; then
    cp .env.example .env
    echo "⚠️  Please update .env file with your API keys"
fi

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install

# Start Docker services
echo "🐳 Starting Docker services..."
cd ..
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Run database migrations
echo "🗄️  Setting up database..."
docker-compose exec backend node src/utils/init-db.js

echo "✅ Setup complete!"
echo ""
echo "📊 Services running:"
echo "   Backend API: http://localhost:3000"
echo "   Frontend: http://localhost:3001"
echo "   PostgreSQL: localhost:5432"
echo "   Redis: localhost:6379"
echo ""
echo "🚪 To stop services: docker-compose down"
echo "📝 Don't forget to update .env with your API keys!"