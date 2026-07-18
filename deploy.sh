#!/bin/bash

# Face Attendance System Deployment Script
set -e

echo "🚀 Starting deployment process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    print_error ".env.production file not found!"
    print_warning "Please create .env.production with your production environment variables"
    exit 1
fi

print_status "Environment file found ✓"

# Install dependencies
print_status "Installing dependencies..."
npm ci --production=false

# Build the application
print_status "Building application..."
npm run build

# Run database migrations
print_status "Running database migrations..."
dotenv -e .env.production -- npm run db:migrate

print_status "Pushing schema changes..."
dotenv -e .env.production -- npm run db:push

# Stop existing PM2 process if running
print_status "Stopping existing PM2 processes..."
pm2 stop ecosystem.config.cjs || true
pm2 delete ecosystem.config.cjs || true

# Start the application with PM2
print_status "Starting application with PM2..."
pm2 start ecosystem.config.cjs --env production

# Save PM2 configuration
print_status "Saving PM2 configuration..."
pm2 save

print_status "🎉 Deployment completed successfully!"
print_status "Application is now running on production server"

# Show PM2 status
print_status "Current PM2 status:"
pm2 status