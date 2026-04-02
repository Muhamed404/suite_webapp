#!/bin/bash
# SecureMagnus AwareMagnus Environment Configuration Script
# This script creates the .env file for the Next.js application

set -e

DEPLOY_DIR="/opt/secure-magnus/suite_webapp/awaremagnus"

echo "Creating environment configuration..."
cat > "$DEPLOY_DIR/.env" << EOF
# AwareMagnus Next.js Environment Configuration
NODE_ENV=production
PORT=${AWAREMAGNUS_PORT:-8001}

# API Configuration
NEXT_PUBLIC_API_URL=${AWAREMAGNUS_API_URL:-http://127.0.0.1:8001}

# Service URLs
NEXT_PUBLIC_SERVICE_AWM_URL=${NEXT_PUBLIC_SERVICE_AWM_URL:-http://localhost:3001}
NEXT_PUBLIC_SERVICE_SUITE_URL=${NEXT_PUBLIC_SERVICE_SUITE_URL:-http://localhost:3000}
EOF

# Set proper permissions and ownership for .env file
chown ubuntu:ubuntu "$DEPLOY_DIR/.env"
chmod 600 "$DEPLOY_DIR/.env"

echo "Environment configuration created successfully at $DEPLOY_DIR/.env"
