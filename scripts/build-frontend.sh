#!/bin/bash

# Build Frontend Script
# Builds the React frontend for production

set -e

echo "Building Machine HMI Frontend..."

cd "$(dirname "$0")/../frontend"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Build
echo "Building..."
npm run build

echo "Frontend build complete! Output in frontend/dist/"
