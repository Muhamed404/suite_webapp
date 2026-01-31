#!/bin/bash
# SecureMagnus AwareMagnus (Next.js) Deployment Script
# This script runs on the OCI server to deploy the Next.js application

set -e

DEPLOY_DIR="/opt/secure-magnus/suite_webapp/awaremagnus"
BACKUP_DIR="/opt/secure-magnus-backups/awaremagnus"
LOGS_DIR_PATH="/opt/secure-magnus/logs"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
TEMP_DIR="/tmp/awaremagnus_deploy_$$"
SERVICE_USER="ubuntu"
SERVICE_NAME="awaremagnus_webapp"

echo "Starting AwareMagnus (Next.js) deployment..."

# Create all required directories
echo "Creating required directories..."
sudo mkdir -p "$BACKUP_DIR"
sudo mkdir -p "$LOGS_DIR_PATH"
mkdir -p "$TEMP_DIR"

# Set ownership for directories
sudo chown -R $SERVICE_USER:$SERVICE_USER /opt/secure-magnus
sudo chown -R $SERVICE_USER:$SERVICE_USER "$BACKUP_DIR"

# Backup and remove existing deployment if exists
if [ -d "$DEPLOY_DIR" ]; then
    echo "Backing up existing deployment to $BACKUP_DIR/awaremagnus_$TIMESTAMP..."

    # Stop the service first to ensure clean backup
    echo "Stopping $SERVICE_NAME service if running..."
    sudo systemctl stop $SERVICE_NAME 2>/dev/null || true

    # Create backup by copying (to preserve original in case of issues)
    sudo cp -r "$DEPLOY_DIR" "$BACKUP_DIR/awaremagnus_$TIMESTAMP"

    if [ -d "$BACKUP_DIR/awaremagnus_$TIMESTAMP" ]; then
        echo "Backup created successfully at $BACKUP_DIR/awaremagnus_$TIMESTAMP"

        # Now completely remove the existing deployment
        echo "Removing existing deployment directory..."
        sudo rm -rf "$DEPLOY_DIR"

        if [ -d "$DEPLOY_DIR" ]; then
            echo "ERROR: Failed to remove existing deployment directory"
            exit 1
        fi
        echo "Existing deployment removed successfully"
    else
        echo "ERROR: Backup failed - aborting deployment"
        exit 1
    fi
else
    echo "No existing deployment found at $DEPLOY_DIR - fresh installation"
fi

# Extract new deployment
echo "Extracting deployment package..."
cd "$TEMP_DIR"
tar -xzf /tmp/awaremagnus_deployment.tar.gz

# Move to deployment directory
echo "Installing new version..."
sudo mv deployment/awaremagnus "$DEPLOY_DIR"
sudo chown -R $SERVICE_USER:$SERVICE_USER "$DEPLOY_DIR"
sudo chmod -R 755 "$DEPLOY_DIR"

# Install production dependencies only (since .next is already built)
echo "Installing Node.js production dependencies..."
cd "$DEPLOY_DIR"
npm install --only=production

# Create .env.local file from environment variables
if [ -f "/tmp/create-awaremagnus-env.sh" ]; then
    echo "Running create-awaremagnus-env.sh..."
    sudo /tmp/create-awaremagnus-env.sh
else
    echo "ERROR: create-awaremagnus-env.sh not found at /tmp/create-awaremagnus-env.sh"
    exit 1
fi

# Register and restart the application using systemd
echo "Registering and restarting application service..."

# Call register-awaremagnus-service.sh to register the systemd service
if [ -f "/tmp/register-awaremagnus-service.sh" ]; then
    echo "Running register-awaremagnus-service.sh..."
    sudo /tmp/register-awaremagnus-service.sh
else
    echo "ERROR: register-awaremagnus-service.sh not found at /tmp/register-awaremagnus-service.sh"
    exit 1
fi

# Cleanup
echo "Cleaning up..."
rm -rf "$TEMP_DIR"
rm -f /tmp/awaremagnus_deployment.tar.gz
rm -f /tmp/deploy-awaremagnus.sh
rm -f /tmp/register-awaremagnus-service.sh
rm -f /tmp/create-awaremagnus-env.sh

# Health check
echo "Performing health check..."
AWAREMAGNUS_PORT=${AWAREMAGNUS_PORT:-8001}
sleep 5  # Give Next.js time to start

if curl -f http://localhost:$AWAREMAGNUS_PORT 2>/dev/null; then
  echo "AwareMagnus health check passed"
else
  echo "AwareMagnus health check failed (service may still be starting)"
  echo "Check logs with: sudo journalctl -u $SERVICE_NAME -f"
fi

echo ""
echo "=========================================="
echo "AwareMagnus deployment completed successfully!"
echo "=========================================="
