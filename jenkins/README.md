# Jenkins CI/CD Pipeline — suite_webapp + awaremagnus

## Overview

This folder contains the Jenkins pipeline configuration for deploying two services:

- **suite_webapp** — Express/EJS frontend (port 8000)
- **awaremagnus** — Next.js app (port 8001)

Both services are deployed to an OCI server via SSH from a separate Jenkins server.

---

## Folder Structure

```
jenkins/
├── Jenkinsfile
└── scripts/
    ├── suite_webapp_deply.sh
    └── awaremagnus_deply.sh
```

---

## Architecture

```
GitHub Push
    ↓
Generic Webhook Trigger
    ↓
Jenkins Server (193.122.69.82:8080)
    ↓ SSH
OCI Server
    ├── suite_webapp  (PM2, port 8000)
    └── awaremagnus  (PM2, port 8001)
```

---

## Pipeline Stages

| Stage | Description |
|-------|-------------|
| Check Changed Files | Determines which service to deploy based on changed files |
| Verify Branch | Logs branch, commit SHA, and message |
| Checkout Code | Clones the repo on Jenkins server |
| Log Deployment Info | Logs deployment details |
| Create Package — suite_webapp | Creates tar.gz excluding node_modules |
| Create Package — awaremagnus | Creates tar.gz excluding node_modules and .next |
| Check Required Secrets | Validates all Jenkins credentials are configured |
| Transfer Files — suite_webapp | SCPs package and deploy script to OCI server |
| Transfer Files — awaremagnus | SCPs package and deploy script to OCI server |
| Setup OCI Server | Installs nvm, Node.js 20.19.2, and PM2 if not present |
| Deploy suite_webapp | Runs suite_webapp_deply.sh on OCI server |
| Deploy awaremagnus | Runs awaremagnus_deply.sh on OCI server |
| Health Check | Verifies both services are running |

---

## Deployment Scripts

### suite_webapp_deply.sh

```
1. Load NVM
2. Create required directories
3. Stop existing PM2 process + kill port 8000
4. Remove existing deployment
5. Extract tar.gz → mv to /app/secure_magnus/suite_webapp
6. npm install (includes devDependencies for nodemon)
7. Create .env
8. Start with PM2 → npm run development
9. Cleanup
10. Health check → localhost:8000/health
```

### awaremagnus_deply.sh

```
1. Load NVM
2. Create required directories
3. Stop existing PM2 process + kill port 8001
4. Remove existing deployment
5. Extract tar.gz → cp -r to /app/secure_magnus/suite_webapp/awaremagnus
6. Create .env
7. Copy iSpring files (if available)
8. npm install (all dependencies)
9. npm run build
10. npm prune --omit=dev
11. Start with PM2 → npm start
12. Cleanup
13. Health check → localhost:8001/awm
```

---

## Server Paths

| Path | Description |
|------|-------------|
| `/app/secure_magnus/suite_webapp` | suite_webapp deployment |
| `/app/secure_magnus/suite_webapp/awaremagnus` | awaremagnus deployment |
| `/app/secure_magnus/logs` | PM2 logs for both services |
| `/app/secure_magnus/service_suite/keys` | JWT keys (public.key + private.key) |
| `/app/secure_magnus/secure_magnus_workspace` | Shared workspace |

---

## Jenkins Credentials Required

| ID | Kind | Used By |
|----|------|---------|
| `OCI_HOST` | Secret text | SSH connection |
| `OCI_USER` | Secret text | SSH connection |
| `OCI_SSH_KEY` | SSH private key | SSH connection |
| `REDIS_URL` | Secret text | suite_webapp .env |
| `REDIS_SERVER_IP` | Secret text | suite_webapp .env |
| `REDIS_SERVER_PORT` | Secret text | suite_webapp .env |
| `REDIS_SESSION_SECRET_KEY` | Secret text | suite_webapp .env |
| `AWAREMAGNUS_API_URL` | Secret text | awaremagnus .env |
| `AWAREMAGNUS_PORT` | Secret text | awaremagnus .env |
| `NEXT_PUBLIC_SERVICE_AWM_URL` | Secret text | awaremagnus .env |
| `NEXT_PUBLIC_SERVICE_SUITE_URL` | Secret text | awaremagnus .env |
| `NEXT_PUBLIC_SUITE_WEBAPP_URL` | Secret text | awaremagnus .env |
| `github-securemagnus-token` | Username/password | GitHub checkout |

---

## Jenkins Job Configuration

```
Pipeline:
  Definition  : Pipeline script from SCM
  SCM         : Git
  Repository  : https://github.com/SecureMagnusLLC/suite_webapp.git
  Credentials : github-securemagnus-token
  Branch      : */cicd/jenkins-pipeline
  Script Path : jenkins/Jenkinsfile
```

---

## GitHub Webhook Configuration

```
Payload URL  : http://193.122.69.82:8080/generic-webhook-trigger/invoke?token=suite_webapp_token
Content type : application/json
Secret       : (leave empty)
Events       : Just the push event ✓
Active       : ✓
```

---

## OCI Server Requirements

- Ubuntu 24.04
- nvm + Node.js 20.19.2 (installed automatically by pipeline)
- PM2 (installed automatically by pipeline)
- Redis (`sudo apt-get install redis-server`)
- rsync (`sudo apt-get install rsync`)
- JWT keys at `/app/secure_magnus/service_suite/keys/`

```bash
# Generate JWT keys (run once)
sudo mkdir -p /app/secure_magnus/service_suite/keys
cd /app/secure_magnus/service_suite/keys
sudo openssl genrsa -out private.key 2048
sudo openssl rsa -in private.key -pubout -out public.key
sudo chown -R ubuntu:ubuntu /app/secure_magnus/service_suite/keys
chmod 600 private.key
chmod 644 public.key
```

---

## Migration Notes

Migrated from GitHub Actions to Jenkins with the following changes:

| Before | After |
|--------|-------|
| GitHub Actions runners | Jenkins server |
| systemd services | PM2 process manager |
| `/opt/secure-magnus` | `/app/secure_magnus` |
| `register-suite-webapp-service.sh` | PM2 inline in deploy script |
| `register-awaremagnus-service.sh` | PM2 inline in deploy script |
| `create-awaremagnus-env.sh` | .env creation inline in deploy script |