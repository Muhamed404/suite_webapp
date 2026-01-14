# Suite WebApp - Frontend Application

The Frontend application server (suite webapp) acts as a middleware between a user and the backend system (service suite). It provides a user interface and renders pages according to the user role.

It communicates with the Backend Server (Service Suite), Service TVBS using their exposed APIs.

This project is built with the NodeJS Express framework and includes the **PhishMagnus** (phishing simulation) and **AwareMagnus** (security awareness training) modules.

## Table of Contents

- [Pre-requisites](#pre-requisites)
  - [0. Setup Service Suite Backend](#0-setup-service-suite-backend)
  - [1. Install NPM](#1-install-npm)
  - [2. Install Redis](#2-install-redis)
  - [3. Clone the Frontend Repository](#3-clone-the-frontend-repository)
  - [4. Install Visual Studio Code](#4-install-visual-studio-code)
  - [5. Install Dependencies](#5-install-dependencies)
- [Configuration Setup](#configuration-setup)
  - [1. Create .env File](#1-create-env-file)
  - [2. Required Configuration Variables](#2-required-configuration-variables)
  - [3. Example .env File](#3-example-env-file)
- [Running the Application](#running-the-application)
  - [Development Mode](#development-mode)
  - [Production Mode](#production-mode)
  - [Health Check](#health-check)
- [Technical Documentation](#technical-documentation)

---

## Pre-requisites

Before you can run the Suite WebApp frontend application, ensure you have the following prerequisites installed and configured.

### 0. Setup Service Suite Backend

Setup Service Suite by following [Service Suite Installation](../SecureMagnusLLC/service_suite/README.md)

The frontend application requires the backend Service Suite to be running and accessible.

### 1. Install NPM

Install NPM on your operating system regardless of Linux or Windows.

NPM (Node Package Manager) is required to install project dependencies and run the application.

### 2. Install Redis

Install **Redis** for session management:

**For Windows users:**
- Follow the [WSL and Redis Installation](../Wsl_Redis_Installation.md) guide

**For Linux users:**
```bash
sudo apt install redis-server -y
```

Redis is a critical dependency - the application will not start without a successful Redis connection.

### 3. Clone the Frontend Repository

Clone the **suite_webapp** repository to your local machine.

### 4. Install Visual Studio Code

Install Visual Studio Code with the following recommended plugins:
- HTML CSS Support
- Any other plugins that will help you with NodeJS or Express framework development

### 5. Install Dependencies

Install all project dependencies via terminal. Run the following command in the suite_webapp folder:

```bash
npm install
```

This will install all packages listed in `package.json`.

---

## Configuration Setup

Now you are ready to run the frontend server, but you must configure several environment variables first.

### 1. Create .env File

Create a `.env` file inside the frontend root folder:

```bash
suite_webapp/.env
```

This file will contain all environment-specific configuration variables.

### 2. Required Configuration Variables

The following configuration variables are required in your `.env` file:

- `NODE_ENV`: The environment name (e.g., Development, Production)
- `HOST`: The IP address or hostname where the frontend application server will run
- `PORT`: The port number for the frontend application server
- `BACKEND_EP`: The service suite IP address and port, using HTTP or HTTPS (e.g., http://127.0.0.1:3000)
- `BACKEND_TVBS_URL`: Service TVBS system backend URL
- `REDIS_URL`: Complete Redis connection URL
- `REDIS_SERVER_IP`: Redis server IP address or hostname
- `REDIS_SERVER_PORT`: Redis server port number
- `REDIS_SESSION_SECRET_KEY`: Secret key for Redis session (must be the same in both Backend & Frontend)
- `COOKIE_JWT_TOKEN_EXPIRY`: Cookie expiry & JWT Expiry in minutes
- `SECURE_MAGNUS_WORKSPACE`: The workspace directory path for the application
- `BACKEND_SUITE_PUBLIC_KEY_PATH`: Path to the service suite public key for JWT verification
- `LOGS_DIR`: Directory path where log files will be stored
- `LOGS_FILENAME`: Name of the log file

Sample file of .env is added in the project with the name `template_env.txt`, which contains all the required configuration variables.

### 3. Example .env File

```bash
NODE_ENV=Development
HOST=127.0.0.1
PORT=8000
BACKEND_EP=http://127.0.0.1:3000

REDIS_URL=redis://127.0.0.1:6379
REDIS_SERVER_IP=127.0.0.1
REDIS_SERVER_PORT=6379
REDIS_SESSION_SECRET_KEY=P@ssword123w
COOKIE_JWT_TOKEN_EXPIRY=200

SECURE_MAGNUS_WORKSPACE=c:\secure_magnus_workspace

# Backend TVBS Configuration
BACKEND_TVBS_URL=http://127.0.0.1:9000

# Logger
LOGS_DIR=C:\SecureMagnus\application logs
LOGS_FILENAME="frontend"

# Security Keys
BACKEND_SUITE_PUBLIC_KEY_PATH=C:\secure_magnus_workspace\keys\public.pem
```

---

## Running the Application

### Development Mode

1. Open Terminal and run the following command:

```bash
npm run development
```

2. Upon successful run, the following information will appear in your terminal:

```
✅ Server Started
🚀 Server listening at http://127.0.0.1:8000
🚀 Healthcheck: http://127.0.0.1:8000/health
```

### Production Mode

```bash
npm start
```

### Health Check

The application exposes a health check endpoint at `/health` that returns the service status and environment information.

```bash
curl http://127.0.0.1:8000/health
```

Expected response:
```json
{
  "status": "OK",
  "message": "Frontend service is running",
  "timestamp": "2025-01-11T10:30:45.123Z",
  "environment": "Development"
}
```

---

## Technical Documentation

For detailed technical information about the application architecture, folder structure, dependencies, routes, views, and more, please refer to the [Technical Documentation](TECHNICAL_DOCUMENTATION.md).

The technical documentation includes:
- Application Entry Point (server.js) - Detailed analysis
- Folder Structure
- Constants Files
- Dependencies List
- Routes and API Endpoints
- EJS Views, Templates & Static Assets
- Environment Configuration Details

---