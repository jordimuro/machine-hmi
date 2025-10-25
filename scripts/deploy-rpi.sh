#!/bin/bash

# Deploy to Raspberry Pi Script
# Usage: ./deploy-rpi.sh [user@host] [optional: skip-build]

set -e

# Configuration
RPI_HOST="${1:-pi@192.168.1.50}"
BACKEND_DIR="/opt/machine-hmi-backend"
FRONTEND_DIR="/opt/machine-hmi-frontend"
SKIP_BUILD="${2}"

echo "Deploying Machine HMI to ${RPI_HOST}..."

# Build frontend if not skipping
if [ "$SKIP_BUILD" != "skip-build" ]; then
  echo "Building frontend..."
  ./build-frontend.sh
fi

# Create directories on RPI
echo "Creating directories on Raspberry Pi..."
ssh "${RPI_HOST}" "sudo mkdir -p ${BACKEND_DIR} ${FRONTEND_DIR}/dist && sudo chown -R pi:pi /opt/machine-hmi-*"

# Deploy backend
echo "Deploying backend..."
rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude 'data' \
  --exclude '.env' \
  "$(dirname "$0")/../backend/" \
  "${RPI_HOST}:${BACKEND_DIR}/"

# Deploy frontend
echo "Deploying frontend..."
rsync -avz --delete \
  "$(dirname "$0")/../frontend/dist/" \
  "${RPI_HOST}:${FRONTEND_DIR}/dist/"

# Install backend dependencies on RPI
echo "Installing backend dependencies on Raspberry Pi..."
ssh "${RPI_HOST}" "cd ${BACKEND_DIR} && npm install --production"

# Copy and enable systemd service
echo "Setting up systemd service..."
scp "$(dirname "$0")/machine-hmi.service" "${RPI_HOST}:/tmp/"
ssh "${RPI_HOST}" "sudo mv /tmp/machine-hmi.service /etc/systemd/system/ && \
  sudo systemctl daemon-reload && \
  sudo systemctl enable machine-hmi && \
  sudo systemctl restart machine-hmi"

echo "Deployment complete!"
echo "Check status with: ssh ${RPI_HOST} 'sudo systemctl status machine-hmi'"
