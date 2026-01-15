#!/bin/bash
# SecureMagnus Suite Webapp Deployment Script
# This script runs on the OCI server to deploy the application

set -e

DEPLOY_DIR="/opt/secure-magnus/suite_webapp"
BACKUP_DIR="/opt/secure-magnus-backups/suite_webapp"
WORKSPACE_DIR="/opt/secure-magnus/secure_magnus_workspace"
LOGS_DIR_PATH="/opt/secure-magnus/logs"
KEYS_DIR="/opt/secure-magnus/secure_magnus_workspace/keys"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
TEMP_DIR="/tmp/suite_webapp_deploy_$$"
SERVICE_USER="ubuntu"

echo "Starting Suite Webapp deployment..."

# Create all required directories
echo "Creating required directories..."
sudo mkdir -p "$BACKUP_DIR"
sudo mkdir -p "$WORKSPACE_DIR"
sudo mkdir -p "$LOGS_DIR_PATH"
sudo mkdir -p "$KEYS_DIR"
mkdir -p "$TEMP_DIR"

# Set ownership for directories
sudo chown -R $SERVICE_USER:$SERVICE_USER /opt/secure-magnus
sudo chown -R $SERVICE_USER:$SERVICE_USER "$BACKUP_DIR"

# Backup and remove existing deployment if exists
if [ -d "$DEPLOY_DIR" ]; then
    echo "Backing up existing deployment to $BACKUP_DIR/suite_webapp_$TIMESTAMP..."

    # Stop the service first to ensure clean backup
    echo "Stopping suite_webapp service if running..."
    sudo systemctl stop suite_webapp 2>/dev/null || true

    # Create backup by copying (to preserve original in case of issues)
    sudo cp -r "$DEPLOY_DIR" "$BACKUP_DIR/suite_webapp_$TIMESTAMP"

    if [ -d "$BACKUP_DIR/suite_webapp_$TIMESTAMP" ]; then
        echo "Backup created successfully at $BACKUP_DIR/suite_webapp_$TIMESTAMP"

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
tar -xzf /tmp/suite_webapp_deployment.tar.gz

# Move to deployment directory
echo "Installing new version..."
sudo mv deployment/suite_webapp "$DEPLOY_DIR"
sudo chown -R $SERVICE_USER:$SERVICE_USER "$DEPLOY_DIR"
sudo chmod -R 755 "$DEPLOY_DIR"

# Install dependencies
echo "Installing Node.js dependencies..."
cd "$DEPLOY_DIR"
npm install --only=production --no-package-lock

# Create .env file from environment variables
echo "Creating environment configuration..."
cat > "$DEPLOY_DIR/.env" << EOF
# Server Configuration
NODE_ENV=production
HOST=${HOST:-127.0.0.1}
PORT=${PORT:-8000}
BACKEND_EP=${BACKEND_EP:-http://127.0.0.1:3000}


# Redis Configuration
REDIS_URL=${REDIS_URL:-redis://127.0.0.1:6379}
REDIS_SERVER_IP=${REDIS_SERVER_IP:-127.0.0.1}
REDIS_SERVER_PORT=${REDIS_SERVER_PORT:-6379}
REDIS_SESSION_SECRET_KEY=${REDIS_SESSION_SECRET_KEY:-uftkPbVhr7IdY0pb51kcjiI1vKH7syxtzwXty}

# JWT Configuration
COOKIE_JWT_TOKEN_EXPIRY=${COOKIE_JWT_TOKEN_EXPIRY:-10}

# Workspace Configuration
SECURE_MAGNUS_WORKSPACE=${SECURE_MAGNUS_WORKSPACE:-/opt/secure-magnus/secure_magnus_workspace}

# Backend TVBS Configuration
BACKEND_TVBS_URL=${BACKEND_TVBS_URL:-http://127.0.0.1:9000}

# Logger Configuration
LOGS_DIR=${LOGS_DIR:-/opt/secure-magnus/logs}
LOGS_FILENAME=${LOGS_FILENAME:-suite_webapp}

BACKEND_SUITE_PUBLIC_KEY_PATH=${BACKEND_SUITE_PUBLIC_KEY_PATH:-/opt/secure-magnus/secure_magnus_workspace/keys/public.pem}
EOF

# Set proper permissions for .env file (readable only by owner)
chmod 600 "$DEPLOY_DIR/.env"

# Register and restart the application using systemd
echo "Registering and restarting application service..."

# Call register-service.sh to register the systemd service
if [ -f "/tmp/register-service.sh" ]; then
    echo "Running register-service.sh..."
    sudo /tmp/register-service.sh
else
    echo "ERROR: register-service.sh not found at /tmp/register-service.sh"
    exit 1
fi

# Cleanup
echo "Cleaning up..."
rm -rf "$TEMP_DIR"
rm -f /tmp/suite_webapp_deployment.tar.gz
rm -f /tmp/deploy.sh
rm -f /tmp/register-service.sh

# Health check
echo "Performing health check..."
APP_HOST=${HOST:-127.0.0.1}
APP_PORT=${PORT:-3000}
MAX_RETRIES=5
RETRY_DELAY=3

for i in $(seq 1 $MAX_RETRIES); do
    echo "Health check attempt $i of $MAX_RETRIES..."
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://${APP_HOST}:${APP_PORT}/" 2>/dev/null || echo "000")

    if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "302" ] || [ "$HTTP_STATUS" = "301" ] || [ "$HTTP_STATUS" = "401" ] || [ "$HTTP_STATUS" = "403" ]; then
        echo "Health check passed! HTTP Status: $HTTP_STATUS"
        echo ""
        echo "=========================================="
        echo "Deployment completed successfully!"
        echo "Application is running at http://${APP_HOST}:${APP_PORT}"
        echo "=========================================="
        exit 0
    fi

    if [ $i -lt $MAX_RETRIES ]; then
        echo "Service not ready yet (HTTP Status: $HTTP_STATUS). Retrying in ${RETRY_DELAY}s..."
        sleep $RETRY_DELAY
    fi
done

echo ""
echo "=========================================="
echo "WARNING: Health check failed after $MAX_RETRIES attempts"
echo "Last HTTP Status: $HTTP_STATUS"
echo "The application may still be starting up."
echo "Please check logs: sudo journalctl -u suite_webapp -f"
echo "Service status: sudo systemctl status suite_webapp"
echo "=========================================="
exit 1
