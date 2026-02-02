#!/bin/bash
# SecureMagnus AwareMagnus Environment Configuration Script
# This script creates the .env.local file for the Next.js application

set -e

DEPLOY_DIR="/opt/secure-magnus/suite_webapp/awaremagnus"

echo "Creating environment configuration..."
cat > "$DEPLOY_DIR/.env.local" << EOF
# AwareMagnus Next.js Environment Configuration
NODE_ENV=production
PORT=${AWAREMAGNUS_PORT:-8001}

# API Configuration
NEXT_PUBLIC_API_URL=${AWAREMAGNUS_API_URL:-http://127.0.0.1:3001}
EOF

# Set proper permissions for .env.local file (readable only by owner)
chmod 600 "$DEPLOY_DIR/.env.local"

echo "Environment configuration created successfully at $DEPLOY_DIR/.env.local"
