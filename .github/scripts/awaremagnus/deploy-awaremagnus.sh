#!/bin/bash
# SecureMagnus AwareMagnus (Next.js) Deployment Script
# Flow: Copy files → npm install → npm run build → register service (npm start)

set -e

DEPLOY_DIR="/opt/secure-magnus/suite_webapp/awaremagnus"
LOGS_DIR_PATH="/opt/secure-magnus/logs"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
TEMP_DIR="/tmp/awaremagnus_deploy_$$"
SERVICE_USER="ubuntu"
SERVICE_NAME="awaremagnus"
AWAREMAGNUS_PORT=${AWAREMAGNUS_PORT:-8001}

echo "Starting AwareMagnus (Next.js) deployment..."

# Create all required directories
echo "Creating required directories..."
sudo mkdir -p "$LOGS_DIR_PATH"
sudo mkdir -p "$DEPLOY_DIR"
mkdir -p "$TEMP_DIR"

# Set ownership for directories
sudo chown -R $SERVICE_USER:$SERVICE_USER /opt/secure-magnus

# Stop the service if running
echo "Stopping $SERVICE_NAME service if running..."
sudo systemctl stop $SERVICE_NAME 2>/dev/null || true

# Remove existing deployment if exists
if [ -d "$DEPLOY_DIR" ] && [ "$(ls -A $DEPLOY_DIR)" ]; then
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

# Copying iSpring interactive module files to the Next.js public directory
ISPRING_SOURCE="/opt/secure-magnus/secure_magnus_workspace/service_awm/contents/interactive_modules/system_files"
ISPRING_DEST="$DEPLOY_DIR/public/interactive_modules/system_files"

echo "Copying iSpring files to public directory..."
echo "  Source: $ISPRING_SOURCE"
echo "  Destination: $ISPRING_DEST"
if [ -d "$ISPRING_SOURCE" ]; then
    echo "  Source directory exists. Contents:"
    ls -la "$ISPRING_SOURCE" || echo "  WARNING: Could not list source directory contents"
    sudo mkdir -p "$ISPRING_DEST"
    sudo cp -r "$ISPRING_SOURCE"/* "$ISPRING_DEST/"
    sudo chown -R $SERVICE_USER:$SERVICE_USER "$ISPRING_DEST"
    echo "  iSpring files copied successfully to $ISPRING_DEST"
    echo "  Destination contents:"
    ls -la "$ISPRING_DEST" || echo "  WARNING: Could not list destination directory contents"
else
    echo "WARNING: iSpring source directory not found at $ISPRING_SOURCE"
    echo "  Checking parent directory..."
    ls -la "$(dirname "$ISPRING_SOURCE")" 2>/dev/null || echo "  Parent directory $(dirname "$ISPRING_SOURCE") also not found"
fi

# Clean old node_modules and build cache
echo "Cleaning old node_modules and .next from awaremagnus..."
rm -rf "$DEPLOY_DIR/node_modules"
rm -rf "$DEPLOY_DIR/.next"

# Step 1: npm install
echo "=========================================="
echo "Step 1: Running npm install..."
echo "=========================================="
cd "$DEPLOY_DIR"
# Full install needed - devDependencies include build tools (TypeScript, Tailwind, etc.)
npm install

ls -lah .env

# After build, prune dev dependencies to reduce deployment size
# This is handled after Step 2 below

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

# Prune devDependencies after build to reduce deployment size
echo "Pruning devDependencies..."
cd "$DEPLOY_DIR"
npm prune --omit=dev

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
