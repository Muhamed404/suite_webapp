# GitHub Secrets Setup Guide

This document outlines all the GitHub secrets that need to be configured for the SecureMagnus Suite CI/CD pipeline to work properly.

## 🔐 Required GitHub Secrets

### OCI (Oracle Cloud Infrastructure) Secrets

These secrets are required for deploying to your OCI server:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `OCI_SSH_PRIVATE_KEY` | Private SSH key for connecting to OCI server | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `OCI_SERVER_HOST` | IP address or hostname of your OCI server | `192.168.1.100` or `your-server.oci.com` |
| `OCI_SERVER_USER` | Username for SSH connection to OCI server | `ubuntu` or `opc` |
| `OCI_API_KEY` | OCI API key for programmatic access | `-----BEGIN PRIVATE KEY-----...` |
| `OCI_API_FINGERPRINT` | Fingerprint of the OCI API key | `aa:bb:cc:dd:ee:ff:00:11:22:33:44:55:66:77:88:99` |
| `OCI_TENANCY_OCID` | OCI Tenancy OCID | `ocid1.tenancy.oc1..aaaaaaa...` |
| `OCI_USER_OCID` | OCI User OCID | `ocid1.user.oc1..aaaaaaa...` |


### Redis Secrets

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `REDIS_URL` | Redis server host | `redis://127.0.0.1:6379` or `your-redis-server.com` |
| `REDIS_SERVER_IP` | Redis server ip | `127.0.0.1` |
| `REDIS_SERVER_PORT` | Redis server port | `6379` |
| `REDIS_SESSION_SECRET_KEY` | Redis session password | `P@ssword123w` or `default password` |


## 🛠️ How to Add GitHub Secrets

### Method 1: Using GitHub Web Interface

1. Go to your GitHub repository
2. Click on **Settings** tab
3. In the left sidebar, click on **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Enter the secret name and value
6. Click **Add secret**

### Method 2: Using GitHub CLI

```bash
# Install GitHub CLI if not already installed
# https://cli.github.com/

# Login to GitHub
gh auth login

# Add secrets (replace with your actual values)
gh secret set OCI_SSH_PRIVATE_KEY --body "$(cat ~/.ssh/id_rsa)"
gh secret set OCI_SERVER_HOST --body "your-server-ip"
gh secret set OCI_SERVER_USER --body "ubuntu"
# ... continue for all other secrets
```

## 🔧 OCI Server Setup Requirements

Your OCI server should have the following setup:

### 1. User Setup

```bash
# Create securemagnus user
sudo useradd -m -s /bin/bash securemagnus
sudo usermod -aG sudo securemagnus

# Create application directory
sudo mkdir -p /opt/securemagnus
sudo chown securemagnus:securemagnus /opt/securemagnus
```

### 3. Dependencies Installation

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Redis
sudo apt-get install -y redis-server

# Install other dependencies
sudo apt-get install -y curl wget git
```

## 🔍 Health Check Endpoints

The CI/CD pipeline expects the following health check endpoints to be available:

- `http://localhost:8000/health` - Suite Webapp service  

Make sure your applications expose these endpoints.

## 🚨 Security Best Practices

1. **Never commit secrets to the repository**
2. **Use strong, unique passwords for each service**
3. **Rotate secrets regularly**
4. **Use least privilege principle for database users**
5. **Enable SSL/TLS for database connections**
6. **Use SSH key authentication instead of passwords**
7. **Monitor access logs regularly**

## 📋 Verification Checklist

Before running the CI/CD pipeline, verify:

- [ ] All GitHub secrets are configured
- [ ] OCI server is accessible via SSH
- [ ] Database is running and accessible
- [ ] Redis is running and accessible
- [ ] SMTP server is configured correctly
- [ ] Systemd services are created on OCI server
- [ ] Health check endpoints are implemented
- [ ] Firewall rules allow necessary ports

## 🆘 Troubleshooting

### Common Issues:

1. **SSH Connection Failed**
   - Verify `OCI_SSH_PRIVATE_KEY` is correct
   - Check `OCI_SERVER_HOST` and `OCI_SERVER_USER`
   - Ensure SSH key is added to server's authorized_keys

2. **Deployment Fails**
   - Check if `/opt/securemagnus` directory exists
   - Verify systemd services are created
   - Check application logs: `sudo journalctl -u securemagnus-*`

### Getting Help:

1. Check GitHub Actions logs for detailed error messages
2. Review application logs on the OCI server
3. Verify all secrets are correctly set
4. Test SSH connection manually: `ssh user@host`

## 📞 Support

If you encounter issues with the CI/CD setup:

1. Check the GitHub Actions logs for detailed error messages
2. Verify all secrets are correctly configured
3. Test the deployment process manually
4. Review the application logs on your OCI server 