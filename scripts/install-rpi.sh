#!/bin/bash

# Installation Script for Raspberry Pi
# Run this script on the Raspberry Pi

set -e

echo "Installing Machine HMI Edge on Raspberry Pi..."

# Update system
echo "Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install Node.js (using NodeSource repository for latest LTS)
echo "Installing Node.js..."
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"

# Install build essentials for native modules
echo "Installing build tools..."
sudo apt-get install -y build-essential python3

# Create application directories
echo "Creating application directories..."
sudo mkdir -p /opt/machine-hmi-backend/data
sudo mkdir -p /opt/machine-hmi-frontend/dist
sudo chown -R pi:pi /opt/machine-hmi-*

# Create .env file if it doesn't exist
if [ ! -f /opt/machine-hmi-backend/.env ]; then
  echo "Creating default .env file..."
  cat > /opt/machine-hmi-backend/.env << 'EOF'
# OPC UA Configuration
OPCUA_ENDPOINT=opc.tcp://192.168.1.10:4840
POLLING_RATE_MS=1000
LOG_INTERVAL_MS=5000

# Authentication
JWT_SECRET=$(openssl rand -base64 32)
PIN_OPERATOR=1111
PIN_MAINTENANCE=2222

# Server
PORT=8080
NODE_ENV=production
EOF
fi

echo "Installation complete!"
echo ""
echo "Next steps:"
echo "1. Edit /opt/machine-hmi-backend/.env with your configuration"
echo "2. Run the deploy script from your development machine:"
echo "   ./scripts/deploy-rpi.sh pi@<raspberry-pi-ip>"
echo ""
echo "After deployment, access the HMI at: http://<raspberry-pi-ip>:8080"
