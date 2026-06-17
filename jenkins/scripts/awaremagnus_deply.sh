#!/bin/bash
# SecureMagnus AwareMagnus Deployment Script
# Updated: systemd → PM2 | paths: /opt/secure-magnus → /app/secure_magnus

set -e

DEPLOY_DIR="/app/secure_magnus/suite_webapp/awaremagnus"
LOGS_DIR="/app/secure_magnus/logs"
WORKSPACE_DIR="/app/secure_magnus/secure_magnus_workspace"
TEMP_DIR="/tmp/awaremagnus_deploy_$$"
SERVICE_USER="ubuntu"
SERVICE_NAME="awaremagnus"
AWAREMAGNUS_PORT=${AWAREMAGNUS_PORT:-8001}
ISPRING_SOURCE="$WORKSPACE_DIR/service_awm/contents/interactive_modules/system_files"
ISPRING_DEST="$DEPLOY_DIR/public/interactive_modules/system_files"

# ── Load NVM ──────────────────────────────────────────────────────────────────
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

echo "Starting AwareMagnus deployment..."

# ── Create required directories ───────────────────────────────────────────────
echo "Creating required directories..."
sudo mkdir -p "$LOGS_DIR"
sudo mkdir -p "$DEPLOY_DIR"
mkdir -p "$TEMP_DIR"
sudo chown -R $SERVICE_USER:$SERVICE_USER /app/secure_magnus

# ── Stop existing PM2 process ─────────────────────────────────────────────────
echo "Stopping existing PM2 process..."
pm2 stop $SERVICE_NAME 2>/dev/null || true
pm2 delete $SERVICE_NAME 2>/dev/null || true
sudo fuser -k 8001/tcp 2>/dev/null || true

# ── Remove existing deployment ────────────────────────────────────────────────
if [ -d "$DEPLOY_DIR" ] && [ "$(ls -A $DEPLOY_DIR)" ]; then
    echo "Removing existing deployment..."
    sudo rm -rf "$DEPLOY_DIR"
    sudo mkdir -p "$DEPLOY_DIR"
else
    echo "Fresh installation"
fi

# ── Extract new deployment ────────────────────────────────────────────────────
echo "Extracting deployment package..."
cd "$TEMP_DIR"
tar -xzf /tmp/awaremagnus_deployment.tar.gz

# ── Copy source files ─────────────────────────────────────────────────────────
echo "Copying files to $DEPLOY_DIR..."
sudo cp -r deployment/awaremagnus/. "$DEPLOY_DIR/"
sudo chown -R $SERVICE_USER:$SERVICE_USER "$DEPLOY_DIR"
sudo chmod -R 755 "$DEPLOY_DIR"

# ── Create .env file ──────────────────────────────────────────────────────────
echo "Creating environment configuration..."
cat > "$DEPLOY_DIR/.env" << ENVEOF
NODE_ENV=production
PORT=${AWAREMAGNUS_PORT:-8001}
NEXT_PUBLIC_API_URL=${AWAREMAGNUS_API_URL:-http://127.0.0.1:8001}
NEXT_PUBLIC_SERVICE_AWM_URL=${NEXT_PUBLIC_SERVICE_AWM_URL:-http://localhost:3001}
NEXT_PUBLIC_SERVICE_SUITE_URL=${NEXT_PUBLIC_SERVICE_SUITE_URL:-http://localhost:3000}
NEXT_PUBLIC_SUITE_WEBAPP_URL=${NEXT_PUBLIC_SUITE_WEBAPP_URL:-http://localhost:8000}
ENVEOF

chown $SERVICE_USER:$SERVICE_USER "$DEPLOY_DIR/.env"
chmod 600 "$DEPLOY_DIR/.env"
echo ".env created successfully"

# ── Copy iSpring files ────────────────────────────────────────────────────────
echo "Copying iSpring files..."
if [ -d "$ISPRING_SOURCE" ]; then
    sudo mkdir -p "$ISPRING_DEST"
    sudo cp -r "$ISPRING_SOURCE/." "$ISPRING_DEST/"
    sudo chown -R $SERVICE_USER:$SERVICE_USER "$ISPRING_DEST"
    echo "iSpring files copied successfully"
else
    echo "WARNING: iSpring source not found — skipping"
fi

# ── Install Node.js dependencies ──────────────────────────────────────────────
echo "Installing Node.js dependencies..."
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

cd "$DEPLOY_DIR"
rm -rf node_modules .next
npm install
echo "Dependencies installed successfully"

# ── Build Next.js ─────────────────────────────────────────────────────────────
echo "Running npm run build..."
npm run build

if [ ! -d "$DEPLOY_DIR/.next" ]; then
    echo "ERROR: Build failed — .next directory not found"
    exit 1
fi
echo "Build completed successfully"

# ── Prune devDependencies ─────────────────────────────────────────────────────
echo "Pruning devDependencies..."
npm prune --omit=dev

# ── Start with PM2 ────────────────────────────────────────────────────────────
echo "Starting application with PM2..."
pm2 start npm \
    --name $SERVICE_NAME \
    --cwd "$DEPLOY_DIR" \
    --log "$LOGS_DIR/awaremagnus.log" \
    --error "$LOGS_DIR/awaremagnus_error.log" \
    --restart-delay 10000 \
    -- start

pm2 save

# ── Cleanup ───────────────────────────────────────────────────────────────────
echo "Cleaning up..."
rm -rf "$TEMP_DIR"
rm -f /tmp/awaremagnus_deployment.tar.gz
rm -f /tmp/awaremagnus_deply.sh

# ── Health check ──────────────────────────────────────────────────────────────
echo "Performing health check..."
sleep 10
if curl -sf http://localhost:$AWAREMAGNUS_PORT/awm 2>/dev/null; then
    echo "AwareMagnus health check passed"
else
    echo "AwareMagnus health check failed — check pm2 logs"
fi

echo ""
echo "=========================================="
echo "AwareMagnus deployment completed!"
echo "Running on port $AWAREMAGNUS_PORT"
echo "=========================================="