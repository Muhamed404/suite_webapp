#!/bin/bash
# SecureMagnus AwareMagnus Service Registration Script
# Registers awaremagnus as a systemd service using npm start

set -e

SERVICE_NAME="awaremagnus"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
DEPLOY_DIR="/opt/secure-magnus/suite_webapp/awaremagnus"
LOGS_DIR="/opt/secure-magnus/logs"
SERVICE_USER="ubuntu"
NPM_PATH=$(which npm)
AWAREMAGNUS_PORT=${AWAREMAGNUS_PORT:-8001}

echo "Registering AwareMagnus as a systemd service..."

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
    echo "Please run this script with sudo"
    exit 1
fi

# Check if npm is installed
if [ -z "$NPM_PATH" ]; then
    echo "npm not found. Please install Node.js first."
    exit 1
fi

# Check if deployment directory exists
if [ ! -d "$DEPLOY_DIR" ]; then
    echo "Deployment directory not found: $DEPLOY_DIR"
    exit 1
fi

# Check if build output exists
if [ ! -d "$DEPLOY_DIR/.next" ]; then
    echo ".next directory not found - please run npm run build first"
    exit 1
fi

# Create required directories
mkdir -p "$LOGS_DIR"

# Set proper ownership and permissions
echo "Setting permissions..."
chown -R $SERVICE_USER:$SERVICE_USER "$DEPLOY_DIR"
chmod -R 755 "$DEPLOY_DIR"
chmod -R 755 "$LOGS_DIR"

# Secure .env file if exists
if [ -f "$DEPLOY_DIR/.env" ]; then
    chmod 600 "$DEPLOY_DIR/.env"
    chown $SERVICE_USER:$SERVICE_USER "$DEPLOY_DIR/.env"
fi

# Stop existing service if running
if systemctl is-active --quiet "$SERVICE_NAME"; then
    echo "Stopping existing service..."
    systemctl stop "$SERVICE_NAME"
fi

# Create systemd service file
echo "Creating systemd service file..."
cat > "$SERVICE_FILE" << EOF
[Unit]
Description=SecureMagnus AwareMagnus (Next.js)
Documentation=https://securemagnus.com
After=network.target

[Service]
Type=simple
User=$SERVICE_USER
Group=$SERVICE_USER
WorkingDirectory=$DEPLOY_DIR
ExecStart=$NPM_PATH run start -- -p $AWAREMAGNUS_PORT
Restart=on-failure
RestartSec=10
StandardOutput=append:$LOGS_DIR/suite_webapp_awm_sysout.log
StandardError=append:$LOGS_DIR/suite_webapp_awm_syserr.log
SyslogIdentifier=$SERVICE_NAME
Environment=NODE_ENV=production
Environment=PORT=$AWAREMAGNUS_PORT
Environment=PATH=/usr/local/bin:/usr/bin:/bin

# Security hardening
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$DEPLOY_DIR $LOGS_DIR

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd daemon
echo "Reloading systemd daemon..."
systemctl daemon-reload

# Enable service to start on boot
echo "Enabling service to start on boot..."
systemctl enable "$SERVICE_NAME"

# Start the service
echo "Starting service..."
systemctl restart "$SERVICE_NAME"

# Check service status
echo "Checking service status..."
systemctl status "$SERVICE_NAME" --no-pager

echo ""
echo "AwareMagnus service registered successfully!"
echo ""
echo "Useful commands:"
echo "  Start:   sudo systemctl start $SERVICE_NAME"
echo "  Stop:    sudo systemctl stop $SERVICE_NAME"
echo "  Restart: sudo systemctl restart $SERVICE_NAME"
echo "  Status:  sudo systemctl status $SERVICE_NAME"
echo "  Logs:    sudo journalctl -u $SERVICE_NAME -f"
echo ""
echo "AwareMagnus is running on port $AWAREMAGNUS_PORT"
