#!/bin/bash
# SecureMagnus AwareMagnus (Next.js) Deployment Script
# Flow: Copy files → npm install → npm run build → register service (npm start)

set -e

DEPLOY_DIR="/opt/secure-magnus/suite_webapp/awaremagnus"
BACKUP_DIR="/opt/secure-magnus-backups/awaremagnus"
LOGS_DIR_PATH="/opt/secure-magnus/logs"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
TEMP_DIR="/tmp/awaremagnus_deploy_$$"
SERVICE_USER="ubuntu"
SERVICE_NAME="awaremagnus"
AWAREMAGNUS_PORT=${AWAREMAGNUS_PORT:-8001}

echo "Starting AwareMagnus (Next.js) deployment..."

# Create all required directories
echo "Creating required directories..."
sudo mkdir -p "$BACKUP_DIR"
sudo mkdir -p "$LOGS_DIR_PATH"
sudo mkdir -p "$DEPLOY_DIR"
mkdir -p "$TEMP_DIR"

# Set ownership for directories
sudo chown -R $SERVICE_USER:$SERVICE_USER /opt/secure-magnus
sudo chown -R $SERVICE_USER:$SERVICE_USER "$BACKUP_DIR"

# Stop the service if running
echo "Stopping $SERVICE_NAME service if running..."
sudo systemctl stop $SERVICE_NAME 2>/dev/null || true

# Backup existing deployment if exists
if [ -d "$DEPLOY_DIR" ] && [ "$(ls -A $DEPLOY_DIR)" ]; then
    echo "Backing up existing deployment to $BACKUP_DIR/awaremagnus_$TIMESTAMP..."
    sudo cp -r "$DEPLOY_DIR" "$BACKUP_DIR/awaremagnus_$TIMESTAMP"
    echo "Backup created successfully"

    # Remove existing deployment
    echo "Removing existing deployment..."
    sudo rm -rf "$DEPLOY_DIR"
    sudo mkdir -p "$DEPLOY_DIR"
else
    echo "No existing deployment found - fresh installation"
fi

# Extract deployment package
echo "Extracting deployment package..."
cd "$TEMP_DIR"
tar -xzf /tmp/awaremagnus_deployment.tar.gz

# Copy all source files to deploy directory
echo "Copying files to $DEPLOY_DIR..."
sudo cp -r deployment/awaremagnus/* "$DEPLOY_DIR/"
sudo chown -R $SERVICE_USER:$SERVICE_USER "$DEPLOY_DIR"
sudo chmod -R 755 "$DEPLOY_DIR"

# Create .env file
echo "Creating environment configuration..."
if [ -f "/tmp/create-awaremagnus-env.sh" ]; then
    sudo /tmp/create-awaremagnus-env.sh
else
    echo "ERROR: create-awaremagnus-env.sh not found"
    exit 1
fi

# Clean old node_modules and build cache
echo "Cleaning old node_modules and .next from awaremagnus..."
rm -rf "$DEPLOY_DIR/node_modules"
rm -rf "$DEPLOY_DIR/.next"

# Step 1: npm install
echo "=========================================="
echo "Step 1: Running npm install (production only)..."
echo "=========================================="
cd "$DEPLOY_DIR"
# npm install --omit=dev
# enable full install for now to avoid build issues with missing dependencies
npm install

# Step 2: npm run build
echo "=========================================="
echo "Step 2: Running npm run build..."
echo "=========================================="
npm run build

# Verify build output
if [ ! -d "$DEPLOY_DIR/.next" ]; then
    echo "ERROR: Build failed - .next directory not found"
    exit 1
fi
echo "Build completed successfully"

# Step 3: Register systemd service (runs npm start on port)
echo "=========================================="
echo "Step 3: Registering and starting service..."
echo "=========================================="
if [ -f "/tmp/register-awaremagnus-service.sh" ]; then
    sudo AWAREMAGNUS_PORT=$AWAREMAGNUS_PORT /tmp/register-awaremagnus-service.sh
else
    echo "ERROR: register-awaremagnus-service.sh not found"
    exit 1
fi

# Cleanup
echo "Cleaning up temporary files..."
rm -rf "$TEMP_DIR"
rm -f /tmp/awaremagnus_deployment.tar.gz
rm -f /tmp/deploy-awaremagnus.sh
rm -f /tmp/register-awaremagnus-service.sh
rm -f /tmp/create-awaremagnus-env.sh

# Health check
echo "Performing health check..."
sleep 5
if curl -f http://localhost:$AWAREMAGNUS_PORT 2>/dev/null; then
    echo "AwareMagnus health check passed"
else
    echo "AwareMagnus health check failed (service may still be starting)"
    echo "Check logs with: sudo journalctl -u $SERVICE_NAME -f"
fi

echo ""
echo "=========================================="
echo "AwareMagnus deployment completed!"
echo "Running on port $AWAREMAGNUS_PORT"
echo "=========================================="
