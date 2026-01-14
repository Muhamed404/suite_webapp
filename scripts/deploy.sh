#!/bin/bash
# SecureMagnus Suite Webapp Deployment Script
# This script runs on the OCI server to deploy the application

set -e

DEPLOY_DIR="/opt/secure-magnus/suite_webapp"
BACKUP_DIR="/opt/secure-magnus/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "Starting Suite Webapp deployment..."

# Create directories if they don't exist
sudo mkdir -p "$DEPLOY_DIR"
sudo mkdir -p "$BACKUP_DIR"

# Backup existing deployment if exists
if [ -d "$DEPLOY_DIR/current" ]; then
    echo "Backing up existing deployment..."
    sudo mv "$DEPLOY_DIR/current" "$BACKUP_DIR/suite_webapp_$TIMESTAMP" 2>/dev/null || true
fi

# Extract new deployment
echo "Extracting deployment package..."
cd /tmp
tar -xzf suite_webapp_deployment.tar.gz

# Move to deployment directory
echo "Installing new version..."
sudo mv deployment/suite_webapp "$DEPLOY_DIR/current"
sudo chown -R $USER:$USER "$DEPLOY_DIR/current"

# Install dependencies
echo "Installing Node.js dependencies..."
cd "$DEPLOY_DIR/current"
npm install --only=production --no-package-lock

# Create .env file from environment variables
echo "Creating environment configuration..."
cat > "$DEPLOY_DIR/current/.env" << EOF
# Redis Configuration
REDIS_URL=${REDIS_URL:-}
REDIS_SERVER_IP=${REDIS_SERVER_IP:-127.0.0.1}
REDIS_SERVER_PORT=${REDIS_SERVER_PORT:-6379}
REDIS_SESSION_SECRET_KEY=${REDIS_SESSION_SECRET_KEY:-secure-magnus-session-secret-2024}

# Server Configuration
NODE_ENV=production
PORT=3000
EOF

# Restart the application using PM2
echo "Restarting application..."
if command -v pm2 &> /dev/null; then
    pm2 delete suite_webapp 2>/dev/null || true
    pm2 start server.js --name suite_webapp
    pm2 save
else
    echo "PM2 not found. Please install PM2 or start the application manually."
    echo "Run: npm install -g pm2 && pm2 start server.js --name suite_webapp"
fi

# Cleanup
echo "Cleaning up..."
rm -rf /tmp/deployment
rm -f /tmp/suite_webapp_deployment.tar.gz
rm -f /tmp/deploy.sh

echo "Deployment completed successfully!"
