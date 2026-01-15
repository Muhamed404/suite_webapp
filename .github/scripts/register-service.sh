#!/bin/bash
# SecureMagnus Suite Webapp Service Registration Script
# This script registers suite_webapp as a systemd service

set -e

SERVICE_NAME="suite_webapp"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
DEPLOY_DIR="/opt/secure-magnus/suite_webapp"
WORKSPACE_DIR="/opt/secure-magnus/workspace"
LOGS_DIR="/opt/secure-magnus/logs"
KEYS_DIR="/opt/secure-magnus/workspace/keys"
SERVICE_USER="ubuntu"
NODE_PATH=$(which node)

echo "Registering Suite Webapp as a systemd service..."

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
    echo "Please run this script with sudo"
    exit 1
fi

# Check if Node.js is installed
if [ -z "$NODE_PATH" ]; then
    echo "Node.js not found. Please install Node.js first."
    exit 1
fi

# Check if deployment directory exists
if [ ! -d "$DEPLOY_DIR" ]; then
    echo "Deployment directory not found: $DEPLOY_DIR"
    echo "Please run deploy.sh first."
    exit 1
fi

# Create required directories if they don't exist
echo "Ensuring required directories exist..."
mkdir -p "$WORKSPACE_DIR"
mkdir -p "$LOGS_DIR"
mkdir -p "$KEYS_DIR"

# Set proper ownership and permissions
echo "Setting permissions..."
chown -R $SERVICE_USER:$SERVICE_USER /opt/secure-magnus
chown -R $SERVICE_USER:$SERVICE_USER "$DEPLOY_DIR"
chmod -R 755 "$DEPLOY_DIR"
chmod -R 755 "$WORKSPACE_DIR"
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
Description=SecureMagnus Suite Webapp
Documentation=https://securemagnus.com
After=network.target redis.service

[Service]
Type=simple
User=$SERVICE_USER
Group=$SERVICE_USER
WorkingDirectory=$DEPLOY_DIR
ExecStart=$NODE_PATH $DEPLOY_DIR/server.js
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=$SERVICE_NAME
Environment=NODE_ENV=production

# Security hardening
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$DEPLOY_DIR /opt/secure-magnus/logs /opt/secure-magnus/workspace

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
systemctl start "$SERVICE_NAME"

# Check service status
echo "Checking service status..."
systemctl status "$SERVICE_NAME" --no-pager

echo ""
echo "Suite Webapp service registered successfully!"
echo ""
echo "Useful commands:"
echo "  Start:   sudo systemctl start $SERVICE_NAME"
echo "  Stop:    sudo systemctl stop $SERVICE_NAME"
echo "  Restart: sudo systemctl restart $SERVICE_NAME"
echo "  Status:  sudo systemctl status $SERVICE_NAME"
echo "  Logs:    sudo journalctl -u $SERVICE_NAME -f"
