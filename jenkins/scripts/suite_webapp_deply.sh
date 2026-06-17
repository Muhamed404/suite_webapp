#!/bin/bash
# SecureMagnus Suite Webapp Deployment Script
# Updated: systemd → PM2 | paths: /opt/secure-magnus → /app/secure_magnus

set -e

DEPLOY_DIR="/app/secure_magnus/suite_webapp"
WORKSPACE_DIR="/app/secure_magnus/secure_magnus_workspace"
LOGS_DIR="/app/secure_magnus/logs"
KEYS_DIR="/app/secure_magnus/service_suite/keys"
TEMP_DIR="/tmp/suite_webapp_deploy_$$"
SERVICE_USER="ubuntu"
SERVICE_NAME="suite_webapp"

echo "Starting Suite Webapp deployment..."

# ── Create required directories ──────────────────────────────────────────────
echo "Creating required directories..."
sudo mkdir -p "$WORKSPACE_DIR"
sudo mkdir -p "$LOGS_DIR"
sudo mkdir -p "$KEYS_DIR"
mkdir -p "$TEMP_DIR"
sudo chown -R $SERVICE_USER:$SERVICE_USER "$(dirname $DEPLOY_DIR)"

# ── Stop existing PM2 process ─────────────────────────────────────────────────
echo "Stopping existing PM2 process..."
pm2 stop $SERVICE_NAME 2>/dev/null || true
pm2 delete $SERVICE_NAME 2>/dev/null || true
sudo fuser -k 8000/tcp 2>/dev/null || true

# ── Remove existing deployment ────────────────────────────────────────────────
if [ -d "$DEPLOY_DIR" ]; then
    echo "Removing existing deployment..."
    sudo rm -rf "$DEPLOY_DIR"
else
    echo "Fresh installation"
fi

# ── Extract new deployment ────────────────────────────────────────────────────
echo "Extracting deployment package..."
cd "$TEMP_DIR"
tar -xzf /tmp/suite_webapp_deployment.tar.gz

# ── Move to deployment directory ──────────────────────────────────────────────
echo "Installing new version..."
sudo mv deployment/suite_webapp "$DEPLOY_DIR"
sudo chown -R $SERVICE_USER:$SERVICE_USER "$DEPLOY_DIR"
sudo chmod -R 755 "$DEPLOY_DIR"

# ── Install Node.js dependencies ──────────────────────────────────────────────
echo "Installing Node.js dependencies..."
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

cd "$DEPLOY_DIR"
rm -rf node_modules
npm install --no-package-lock
echo "Dependencies installed successfully"

# ── Create .env file ──────────────────────────────────────────────────────────
echo "Creating environment configuration..."
cat > "$DEPLOY_DIR/.env" << ENVEOF
# Server Configuration
NODE_ENV=development
HOST=127.0.0.1
PORT=8000
BACKEND_EP=${BACKEND_EP:-http://127.0.0.1:3000}

# Redis Configuration
REDIS_URL=${REDIS_URL:-redis://127.0.0.1:6379}
REDIS_SERVER_IP=${REDIS_SERVER_IP:-127.0.0.1}
REDIS_SERVER_PORT=${REDIS_SERVER_PORT:-6379}
REDIS_SESSION_SECRET_KEY=${REDIS_SESSION_SECRET_KEY:-changeme}

# JWT Configuration
COOKIE_JWT_TOKEN_EXPIRY=${COOKIE_JWT_TOKEN_EXPIRY:-10}

# Workspace Configuration
SECURE_MAGNUS_WORKSPACE=$WORKSPACE_DIR

# Backend TVBS Configuration
BACKEND_TVBS_URL=${BACKEND_TVBS_URL:-https://dev-machine.securemagnus.com/tvb}

# Logger Configuration
LOGS_DIR=$LOGS_DIR
LOGS_FILENAME=suite_webapp

# Key Path
BACKEND_SUITE_PUBLIC_KEY_PATH=$KEYS_DIR/public.key

AWAREMAGNUS_DASHBOARD_URL=${AWAREMAGNUS_DASHBOARD_URL:-https://dev-machine.securemagnus.com/awm/}
WEB_TEMPLATE_BUCKET=${WEB_TEMPLATE_BUCKET:-https://objectstorage.me-riyadh-1.oraclecloud.com/p/OrpyV-tItnmm8cldPMTq9QM0v1o6aoplOpe27Sz92GcZjcG7uagcwnXshXMckKyB/n/axqfg50971fp/b/PHM_Templates/o/}
ENVEOF

chmod 600 "$DEPLOY_DIR/.env"
echo ".env created successfully"

# ── Start with PM2 ────────────────────────────────────────────────────────────
echo "Starting application with PM2..."
pm2 start npm \
    --name $SERVICE_NAME \
    --cwd "$DEPLOY_DIR" \
    --log "$LOGS_DIR/suite_webapp.log" \
    --error "$LOGS_DIR/suite_webapp_error.log" \
    --restart-delay 10000 \
    -- run development

pm2 save
pm2 startup systemd -u $SERVICE_USER --hp /home/$SERVICE_USER || true

# ── Cleanup ───────────────────────────────────────────────────────────────────
echo "Cleaning up..."
rm -rf "$TEMP_DIR"
rm -f /tmp/suite_webapp_deployment.tar.gz
rm -f /tmp/suite_webapp_deply.sh

# ── Health check ──────────────────────────────────────────────────────────────
echo "Performing health check..."
sleep 5
if curl -sf http://localhost:8000/health 2>/dev/null; then
    echo "Health check passed"
else
    echo "Health check failed — check pm2 logs"
fi

echo ""
echo "=========================================="
echo "Suite Webapp deployment completed!"
echo "=========================================="