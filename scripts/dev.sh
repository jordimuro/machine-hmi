#!/bin/bash

# Development script to run both backend and frontend

set -e

echo "Starting Machine HMI in development mode..."

# Function to cleanup on exit
cleanup() {
  echo "Stopping services..."
  kill $(jobs -p) 2>/dev/null || true
  exit
}

trap cleanup INT TERM

# Check if .env exists in backend
if [ ! -f "backend/.env" ]; then
  echo "Creating backend/.env from .env.example..."
  cp backend/.env.example backend/.env
fi

# Start backend
echo "Starting backend..."
cd backend
npm install
npm run dev &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 3

# Start frontend
echo "Starting frontend..."
cd ../frontend
npm install
npm run dev &
FRONTEND_PID=$!

echo ""
echo "Services running:"
echo "  Backend:  http://localhost:8080"
echo "  Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop"

# Wait for processes
wait
