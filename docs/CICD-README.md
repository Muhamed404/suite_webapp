# Suite Webapp CI/CD Pipeline Documentation

## Overview

This document describes the CI/CD pipeline for the SecureMagnus Suite Webapp. The pipeline automatically builds, tests, and deploys the application to an OCI (Oracle Cloud Infrastructure) server when changes are pushed to the `development` branch.

## Pipeline Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   GitHub Repo   │────▶│  GitHub Actions │────▶│   OCI Server    │
│  (development)  │     │    (CI/CD)      │     │  (Production)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Workflow File

Location: `.github/workflows/deploy.yml`

## Pipeline Stages

### Stage 1: Verify Development Branch

**Job Name:** `verify-development-branch`

- Checks out the development branch
- Verifies the current branch is `development`
- Fails if not on the correct branch

### Stage 2: Service Validation (Tests)

**Job Name:** `suite_webapp_test`

**Depends on:** `verify-development-branch`

- Checks out the code
- Sets up Node.js (v20.19.2)
- Installs dependencies (`npm install`)
- Runs service validation

### Stage 3: Build and Deploy

**Job Name:** `build-and-deploy`

**Depends on:** `suite_webapp_test`

#### Steps:

1. **Checkout Code**
   - Pulls the latest code from `development` branch

2. **Setup Node.js**
   - Installs Node.js v20.19.2

3. **Install Production Dependencies**
   ```bash
   npm install --only=production --no-package-lock
   ```

4. **Create Deployment Package**
   - Creates `deployment/suite_webapp/` directory
   - Copies application files (excludes: node_modules, .git, .github, .claude, .env, *.md, *.txt, deployment, scripts)
   - Copies deployment scripts

5. **Package Deployment**
   - Creates `suite_webapp_deployment.tar.gz`

6. **Check Required Secrets**
   - Validates OCI_SSH_KEY, OCI_HOST, OCI_USER are configured

7. **Setup SSH**
   - Configures SSH agent with private key

8. **Add OCI Server to Known Hosts**
   - Prevents SSH host verification prompts

9. **Deploy to OCI Server**
   - Transfers deployment package via SCP
   - Executes deploy.sh on the server with environment variables

10. **Notify Deployment Status**
    - Reports success or failure

## Pipeline Flow Diagram

```
┌────────────────────────────────────────────────────────────────────┐
│                        GITHUB ACTIONS                               │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────┐                                           │
│  │ 1. Verify Branch    │                                           │
│  │    (development)    │                                           │
│  └──────────┬──────────┘                                           │
│             │                                                       │
│             ▼                                                       │
│  ┌─────────────────────┐                                           │
│  │ 2. Run Tests        │                                           │
│  │    - npm install    │                                           │
│  │    - validate       │                                           │
│  └──────────┬──────────┘                                           │
│             │                                                       │
│             ▼                                                       │
│  ┌─────────────────────┐                                           │
│  │ 3. Build Package    │                                           │
│  │    - Install deps   │                                           │
│  │    - Create tar.gz  │                                           │
│  └──────────┬──────────┘                                           │
│             │                                                       │
│             ▼                                                       │
│  ┌─────────────────────┐      ┌─────────────────────────────────┐ │
│  │ 4. Deploy via SSH   │─────▶│         OCI SERVER              │ │
│  │    - SCP package    │      │  ┌───────────────────────────┐  │ │
│  │    - Run deploy.sh  │      │  │ deploy.sh                 │  │ │
│  └─────────────────────┘      │  │  - Create directories     │  │ │
│                               │  │  - Set permissions        │  │ │
│                               │  │  - Backup existing        │  │ │
│                               │  │  - Extract package        │  │ │
│                               │  │  - Install dependencies   │  │ │
│                               │  │  - Create .env file       │  │ │
│                               │  │  - Restart PM2            │  │ │
│                               │  │  - Health check           │  │ │
│                               │  └───────────────────────────┘  │ │
│                               └─────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
```

## Deployment Script (deploy.sh)

Location: `.github/scripts/deploy.sh`

### Configuration Variables

| Variable | Value | Description |
|----------|-------|-------------|
| `DEPLOY_DIR` | `/opt/secure-magnus/suite_webapp` | Application deployment directory |
| `BACKUP_DIR` | `/opt/secure-magnus-backups/suite_webapp` | Backup directory |
| `WORKSPACE_DIR` | `/opt/secure-magnus/workspace` | Workspace directory |
| `LOGS_DIR_PATH` | `/opt/secure-magnus/logs` | Logs directory |
| `KEYS_DIR` | `/opt/secure-magnus/workspace/keys` | Keys directory |
| `SERVICE_USER` | `ubuntu` | User that owns and runs the application |

### What It Does:

1. **Creates Required Directories**
   - `/opt/secure-magnus/suite_webapp`
   - `/opt/secure-magnus-backups/suite_webapp`
   - `/opt/secure-magnus/workspace`
   - `/opt/secure-magnus/logs`
   - `/opt/secure-magnus/workspace/keys`

2. **Sets Permissions**
   - Sets ownership to `ubuntu:ubuntu` for all directories
   - Sets `755` permissions on directories
   - Sets `600` permissions on `.env` file (owner read/write only)

3. **Creates Backup**
   - Moves existing deployment to `/opt/secure-magnus-backups/suite_webapp/suite_webapp_YYYYMMDD_HHMMSS`

4. **Extracts Package**
   - Uses unique temp directory (`/tmp/suite_webapp_deploy_$$`) to avoid conflicts with concurrent deployments

5. **Installs to Target**
   - Moves files to `/opt/secure-magnus/suite_webapp`

6. **Installs Node Dependencies**
   - Runs `npm install --only=production`

7. **Creates .env File**
   - Generates environment configuration from passed variables
   - Secures with `600` permissions

8. **Restarts Application**
   - Uses PM2 to restart the service

9. **Health Check**
   - Performs HTTP health check (up to 5 retries with 3-second delays)
   - Accepts HTTP status codes: 200, 301, 302
   - Exits with code 0 on success, 1 on failure

## Service Registration Script (register-service.sh)

Location: `.github/scripts/register-service.sh`

### What It Does:

1. **Creates Required Directories**
   - Same directories as deploy.sh

2. **Sets Permissions**
   - Sets ownership to `ubuntu:ubuntu`
   - Sets `755` on directories
   - Sets `600` on `.env` file

3. **Creates Systemd Service**
   - Creates `/etc/systemd/system/suite_webapp.service`
   - Configures to run as `ubuntu` user
   - Sets up auto-restart on failure
   - Enables security hardening options

4. **Enables and Starts Service**
   - Enables service to start on boot
   - Starts the service immediately

### Usage (One-time setup on OCI server):

```bash
# Copy the script to the server first
scp .github/scripts/register-service.sh ubuntu@oci-server:/tmp/

# On OCI server
sudo chmod +x /tmp/register-service.sh
sudo /tmp/register-service.sh
```

## Directory Permissions

| Path | Owner | Permission | Description |
|------|-------|------------|-------------|
| `/opt/secure-magnus` | ubuntu:ubuntu | 755 | Main application root |
| `/opt/secure-magnus/suite_webapp` | ubuntu:ubuntu | 755 | Application deployment |
| `/opt/secure-magnus/workspace` | ubuntu:ubuntu | 755 | Workspace directory |
| `/opt/secure-magnus/workspace/keys` | ubuntu:ubuntu | 755 | Keys directory |
| `/opt/secure-magnus/logs` | ubuntu:ubuntu | 755 | Logs directory |
| `/opt/secure-magnus-backups/suite_webapp` | ubuntu:ubuntu | 755 | Backups directory |
| `/opt/secure-magnus/suite_webapp/.env` | ubuntu:ubuntu | 600 | Environment file (secure) |

## Required GitHub Secrets

### Mandatory Secrets

| Secret | Description |
|--------|-------------|
| `OCI_SSH_KEY` | SSH private key for OCI server access |
| `OCI_HOST` | OCI server hostname or IP address |
| `OCI_USER` | SSH username for OCI server (typically `ubuntu`) |

### Application Secrets (Optional - have defaults)

| Secret | Description | Default |
|--------|-------------|---------|
| `REDIS_URL` | Redis connection URL | (empty) |
| `REDIS_SERVER_IP` | Redis server IP | 127.0.0.1 |
| `REDIS_SERVER_PORT` | Redis server port | 6379 |
| `REDIS_SESSION_SECRET_KEY` | Session secret key | secure-magnus-session-secret-2024 |
| `COOKIE_JWT_TOKEN_EXPIRY` | JWT expiry in minutes | 200 |
| `SECURE_MAGNUS_WORKSPACE` | Workspace directory | /opt/secure-magnus/workspace |
| `BACKEND_TVBS_URL` | Backend TVBS URL | http://127.0.0.1:9000 |
| `BACKEND_EP` | Backend endpoint | http://127.0.0.1:3000 |
| `BACKEND_SUITE_PUBLIC_KEY_PATH` | Public key path | /opt/secure-magnus/workspace/keys/public.pem |
| `LOGS_DIR` | Log directory | /opt/secure-magnus/logs |
| `LOGS_FILENAME` | Log filename | suite_webapp |
| `HOST` | Server host | 127.0.0.1 |
| `PORT` | Server port | 3000 |

## Server Directory Structure

```
/opt/secure-magnus/                          # Owner: ubuntu:ubuntu (755)
├── suite_webapp/                            # Application deployment (755)
│   ├── server.js                            # Main application entry point
│   ├── package.json
│   ├── .env                                 # Environment configuration (600)
│   └── ...                                  # Application files
├── workspace/                               # Workspace directory (755)
│   └── keys/                                # Keys directory (755)
│       └── public.pem                       # Public key for backend
└── logs/                                    # Application logs (755)

/opt/secure-magnus-backups/                  # Owner: ubuntu:ubuntu (755)
└── suite_webapp/                            # Backup directory
    ├── suite_webapp_20240115_143022/
    ├── suite_webapp_20240116_091530/
    └── ...                                  # Timestamped backups
```

## Manual Deployment

If you need to deploy manually:

```bash
# On your local machine
cd suite_webapp
tar -czf suite_webapp_deployment.tar.gz --exclude='node_modules' --exclude='.git' .

# Copy to server
scp suite_webapp_deployment.tar.gz ubuntu@oci-server:/tmp/
scp .github/scripts/deploy.sh ubuntu@oci-server:/tmp/

# On OCI server
chmod +x /tmp/deploy.sh
REDIS_SERVER_IP=10.0.0.5 /tmp/deploy.sh
```

## Service Management

### Using PM2 (Default)

```bash
# View status
pm2 status

# View logs
pm2 logs suite_webapp

# Restart
pm2 restart suite_webapp

# Stop
pm2 stop suite_webapp

# Start
pm2 start suite_webapp
```

### Using Systemd (Optional)

If you've registered the service using `register-service.sh`:

```bash
# Register service (one-time setup)
sudo ./scripts/register-service.sh

# Manage service
sudo systemctl start suite_webapp
sudo systemctl stop suite_webapp
sudo systemctl restart suite_webapp
sudo systemctl status suite_webapp

# View logs
sudo journalctl -u suite_webapp -f
```

## Rollback Procedure

If a deployment fails, you can rollback to a previous version:

```bash
# On OCI server
cd /opt/secure-magnus-backups/suite_webapp

# List available backups
ls -la

# Stop current application
pm2 stop suite_webapp

# Rollback to specific backup
sudo rm -rf /opt/secure-magnus/suite_webapp
sudo mv suite_webapp_YYYYMMDD_HHMMSS /opt/secure-magnus/suite_webapp

# Restore permissions
sudo chown -R ubuntu:ubuntu /opt/secure-magnus/suite_webapp
sudo chmod -R 755 /opt/secure-magnus/suite_webapp
sudo chmod 600 /opt/secure-magnus/suite_webapp/.env

# Restart application
pm2 start suite_webapp
```

## Troubleshooting

### Pipeline Fails at "Check Required Secrets"

- Ensure all required secrets are configured in GitHub repository settings
- Go to: Repository → Settings → Secrets and variables → Actions

### SSH Connection Fails

- Verify OCI_SSH_KEY is the correct private key
- Verify OCI_HOST is reachable
- Verify OCI_USER has SSH access (should be `ubuntu`)

### Health Check Fails

- Check application logs: `pm2 logs suite_webapp`
- Verify port is not in use: `netstat -tlnp | grep 3000`
- Check .env file: `cat /opt/secure-magnus/suite_webapp/.env`
- Verify permissions: `ls -la /opt/secure-magnus/suite_webapp/`

### Application Won't Start

- Check Node.js version: `node --version` (should be v20.x)
- Check dependencies: `cd /opt/secure-magnus/suite_webapp && npm install`
- Check for syntax errors: `node --check server.js`
- Check permissions: `ls -la /opt/secure-magnus/`

### Permission Denied Errors

- Verify ownership: `ls -la /opt/secure-magnus/`
- Fix ownership: `sudo chown -R ubuntu:ubuntu /opt/secure-magnus`
- Fix permissions: `sudo chmod -R 755 /opt/secure-magnus/suite_webapp`

## Trigger Conditions

The pipeline triggers on:

- Push to `development` branch

```yaml
on:
  push:
    branches:
      - development
```

## Security Considerations

1. **Secrets Management**
   - All sensitive data stored in GitHub Secrets
   - Never commit .env files to repository
   - .env file secured with 600 permissions (owner read/write only)

2. **SSH Security**
   - Uses SSH key authentication (no passwords)
   - Host verification via known_hosts

3. **File Permissions**
   - Application runs as `ubuntu` user (not root)
   - Sensitive files (.env) have restricted permissions (600)
   - Directories have standard permissions (755)

4. **Deployment Isolation**
   - Each deployment uses unique temp directory (`/tmp/suite_webapp_deploy_$$`)
   - Prevents conflicts with concurrent deployments

5. **Backup Strategy**
   - Automatic backup before each deployment
   - Timestamped for easy identification and rollback

6. **Systemd Security (if using register-service.sh)**
   - `NoNewPrivileges=true` - Prevents privilege escalation
   - `PrivateTmp=true` - Isolates temp directory
   - `ProtectSystem=strict` - Read-only system directories
   - `ProtectHome=true` - Protects home directories
