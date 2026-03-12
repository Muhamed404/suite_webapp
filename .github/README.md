# CI/CD Pipelines

This directory contains the GitHub Actions workflows and deployment scripts for the SecureMagnus Suite Webapp.

---

## Workflows

| File | App | Trigger | Target Port |
|------|-----|---------|-------------|
| [`workflows/deploy.yml`](workflows/deploy.yml) | Suite Webapp (Express) | Path changes in app source | `:8000` |
| [`workflows/deploy-awaremagnus.yml`](workflows/deploy-awaremagnus.yml) | AwareMagnus (Next.js) | Changes in `awaremagnus/**` | `:8001` |

Both workflows trigger on push to the `development` branch only.

---

## Suite Webapp Pipeline

**Workflow:** `workflows/deploy.yml`

**Triggers on changes to:**
`phishmagnus/`, `productsuite/`, `commons/`, `config/`, `logger/`, `locales/`, `middleware/`, `routes/`, `views/`, `public/`, `utility/`, `server.js`, `package.json`, workflow file, or deploy scripts.

**Jobs:**
```
verify-development-branch → suite_webapp_test → build-and-deploy
```

**Deployment flow on OCI server (`scripts/deploy.sh`):**
1. Backup existing app → stop service → remove old files
2. Extract package → install to `/opt/secure-magnus/suite_webapp`
3. `npm install --only=production` (3 retries with cache clean on failure)
4. Create `.env` from environment variables
5. Register & restart systemd service via `scripts/register-suite-webapp-service.sh`
6. Health check: `curl http://localhost:8000/health`

**Required secrets:** `OCI_SSH_KEY`, `OCI_HOST`, `OCI_USER`

**Optional secrets forwarded to deploy script:** `REDIS_URL`, `REDIS_SERVER_IP`, `REDIS_SERVER_PORT`

---

## AwareMagnus Pipeline

**Workflow:** `workflows/deploy-awaremagnus.yml`

**Triggers on changes to:** `awaremagnus/**`, workflow file, or `scripts/awaremagnus/**`

**Jobs:**
```
verify-development-branch → deploy-awaremagnus
```

**Deployment flow on OCI server (`scripts/awaremagnus/deploy-awaremagnus.sh`):**
1. Stop service → remove old files
2. Extract package → copy to `/opt/secure-magnus/suite_webapp/awaremagnus`
3. Create `.env` via `scripts/awaremagnus/create-awaremagnus-env.sh`
4. Copy iSpring interactive module files to `public/`
5. `npm install` (full — devDeps needed for build)
6. `npm run build` → verify `.next/` exists
7. `npm prune --omit=dev`
8. Register & restart systemd service via `scripts/awaremagnus/register-awaremagnus-service.sh`
9. Health check: `curl http://localhost:8001`

**Required secrets:** `OCI_SSH_KEY`, `OCI_HOST`, `OCI_USER`

**Optional secrets forwarded to deploy script:** `AWAREMAGNUS_API_URL`, `AWAREMAGNUS_PORT`, `NEXT_PUBLIC_SERVICE_AWM_URL`, `NEXT_PUBLIC_SERVICE_SUITE_URL`

---

## Scripts

```
scripts/
├── deploy.sh                              # Suite Webapp deploy (runs on OCI)
├── register-suite-webapp-service.sh       # Suite Webapp systemd service registration
└── awaremagnus/
    ├── deploy-awaremagnus.sh              # AwareMagnus deploy (runs on OCI)
    ├── register-awaremagnus-service.sh    # AwareMagnus systemd service registration
    └── create-awaremagnus-env.sh          # AwareMagnus .env file generator
```

---

## Server Layout

```
/opt/secure-magnus/
├── suite_webapp/               # Express app (port 8000)
│   ├── .env                    # permissions: 600
│   └── awaremagnus/            # Next.js app (port 8001)
│       └── .env                # permissions: 600
├── secure_magnus_workspace/
│   └── keys/public.pem
└── logs/
    ├── suite_webapp_sysout.log
    ├── suite_webapp_syerr.log
    ├── suite_webapp_awm_sysout.log
    └── suite_webapp_awm_syserr.log

/opt/secure-magnus-backups/
└── suite_webapp/               # Timestamped backups (auto-created on each deploy)
```

---

## Required GitHub Secrets

Go to **Repository → Settings → Secrets and variables → Actions** to configure:

| Secret | Used By | Description |
|--------|---------|-------------|
| `OCI_SSH_KEY` | Both | SSH private key for OCI server |
| `OCI_HOST` | Both | OCI server hostname or IP |
| `OCI_USER` | Both | SSH username (typically `ubuntu`) |
| `REDIS_URL` | Suite Webapp | Redis connection URL |
| `REDIS_SERVER_IP` | Suite Webapp | Redis server IP |
| `REDIS_SERVER_PORT` | Suite Webapp | Redis server port |
| `AWAREMAGNUS_API_URL` | AwareMagnus | API base URL |
| `AWAREMAGNUS_PORT` | AwareMagnus | Port to run on (default: `8001`) |
| `NEXT_PUBLIC_SERVICE_AWM_URL` | AwareMagnus | Public AwareMagnus URL |
| `NEXT_PUBLIC_SERVICE_SUITE_URL` | AwareMagnus | Public Suite Webapp URL |

---

## Service Management

```bash
# Suite Webapp
sudo systemctl status suite_webapp
sudo systemctl restart suite_webapp
tail -f /opt/secure-magnus/logs/suite_webapp_syerr.log

# AwareMagnus
sudo systemctl status awaremagnus
sudo systemctl restart awaremagnus
tail -f /opt/secure-magnus/logs/suite_webapp_awm_syserr.log
```

> For full documentation including rollback procedures, manual deployment steps, and troubleshooting, see [`docs/CICD-README.md`](../docs/CICD-README.md).
