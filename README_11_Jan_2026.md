# Suite WebApp - Frontend Application

The Frontend application server (suite webapp) acts as a middleware between a user and the backend system (service suite). It provides a user interface and renders pages according to the user role.

It communicates with the Backend Server (Service Suite), Service TCBS using their exposed APIs.

This project is built with the NodeJS Express framework and includes the **PhishMagnus** (phishing simulation) and **AwareMagnus** (security awareness training) modules.

## Table of Contents

- [Application Entry Point - server.js](#application-entry-point---serverjs)
- [Folder Structure](#folder-structure)
- [Constants Files](#constants-files)
- [Dependencies](#dependencies)
- [Routes and API Endpoints](#routes-and-api-endpoints)
- [EJS Views, Templates & Static Assets](#ejs-views-templates--static-assets)
- [Environment Configuration](#environment-configuration)
- [Pre-requisites](#pre-requisites)
- [Configuration Setup](#configuration-setup)
- [Running the Application](#running-the-application)

---

## Application Entry Point - server.js

[server.js](server.js) is the main entry point and orchestrator of the Frontend Web Application. This file initializes the Express server, configures all middleware, establishes critical dependencies like Redis, and starts the HTTP server.

### Core Responsibilities

The [server.js](server.js) file performs several critical functions in the following order:

#### 1. **Module Imports and Dependencies** (Lines 1-22)

The file begins by importing all necessary dependencies:

```javascript
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const expressLayouts = require('express-ejs-layouts');
const i18n = require('./middleware/i18n-middleware');
const { logger } = require('./logger/logger');
const routes = require('./routes/routes');
const Redis = require('ioredis');
```

**Key imports include:**
- **Express Framework**: Core web server framework
- **Body Parser**: Parses incoming request bodies (JSON and URL-encoded)
- **Express-EJS-Layouts**: Provides layout support for EJS templates
- **i18n Middleware**: Internationalization for multi-language support
- **Winston Logger**: Application logging system
- **Redis Client (ioredis)**: Session storage and caching
- **Custom Middleware**: Authentication, session management, request logging, and menu generation

#### 2. **Global Logger Setup** (Line 26)

```javascript
global.logger = logger;
```

Makes the Winston logger globally accessible throughout the application for consistent logging across all modules.

#### 3. **Express Application Initialization** (Line 28)

```javascript
const app = express();
```

Creates the main Express application instance that will handle all HTTP requests.

#### 4. **Health Check Endpoint** 

```javascript
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Frontend service is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});
```

**Purpose:** Provides a health check endpoint at `/health` for monitoring and load balancers to verify service availability.

**Response Example:**
```json
{
  "status": "OK",
  "message": "Frontend service is running",
  "timestamp": "2025-01-11T10:30:45.123Z",
  "environment": "Development"
}
```

#### 5. **View Engine Configuration** 

```javascript
app.set('view engine', 'ejs');
app.set('views', [
  path.join(__dirname, 'views'),
  path.join(__dirname, 'productsuite', 'views'),
  path.join(__dirname, 'phishmagnus', 'views'),
]);
```

**Configures EJS as the templating engine** and sets up multiple view directories for modular template organization:
- `views/`: Common templates (layouts, error pages)
- `productsuite/views/`: Product Suite module pages
- `phishmagnus/views/`: PhishMagnus module pages

#### 6. **Static Asset Configuration** (Lines 53-57)

```javascript
app.use('/securemagnus_2025', express.static(path.join(__dirname, 'public', 'securemagnus_2025')));
app.use('/phishmagnus', express.static(path.join(__dirname, 'phishmagnus', 'public')));
app.get('/favicon.ico', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'securemagnus_2025', 'favicon.ico'));
});
```

**Serves static files** (CSS, JavaScript, images) from designated directories:
- `/securemagnus_2025/*`: Main application assets
- `/phishmagnus/*`: PhishMagnus-specific assets
- `/favicon.ico`: Application favicon

#### 7. **Body Parser Middleware** 

```javascript
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
```

**Parses incoming request bodies:**
- URL-encoded data from HTML forms
- JSON payloads from API requests

#### 8. **Session Management** 

```javascript
app.use(cookieParserMiddleware);
app.use(storeSessionMiddleware);
```

**Manages user sessions:**
- `cookieParserMiddleware`: Parses cookies from incoming requests
- `storeSessionMiddleware`: Stores session data in Redis for persistence across requests and server restarts

**Session Storage:** Uses Redis as the session store for scalability and persistence. Session data includes:
- User authentication tokens (JWT)
- User roles and permissions
- Flash messages
- Locale preferences

#### 9. **Flash Message System** 

```javascript
app.use(flash());
app.use((req, res, next) => {
  res.locals.message = req.flash('message');
  res.locals.alertType = req.flash('alertType');
  next();
});
```

**Implements flash messages** for one-time notifications (success, error, warning) that persist across redirects. Messages are automatically available in all EJS templates.

#### 10. **Request Logging** 

```javascript
app.use(requestLogger);
```

**Logs all incoming HTTP requests** including:
- Request method (GET, POST, DELETE, etc.)
- Request URL and path
- Response status code
- Response time
- User information (if authenticated)

Logs are written to files using Winston with daily rotation.

#### 11. **Internationalization (i18n)** 

```javascript
app.use(i18n.init);
app.use((req, res, next) => {
  res.locals.locale = req.getLocale();
  next();
});
```

**Enables multi-language support:**
- Detects user language preference from cookies or browser settings
- Makes locale available in all templates via `res.locals.locale`
- Provides translation functions (`__()`) in views

**Supported Languages:** Configured in [locales/](locales/) directory

#### 12. **Conditional Session Validation** (Lines 97-116)

```javascript
app.use((req, res, next) => {
  const skipPaths = [
    FrontendApplicationAPI.LOGIN.PRODUCT_SUITE,
    FrontendApplicationAPI.LOGIN.PRODUCT_SUITE_DEFAULT,
    FrontendApplicationAPI.LOGIN.PHISHMAGNUS,
    FrontendApplicationAPI.LOGIN.AWAREMAGNUS,
    FrontendApplicationAPI.LOGOUT.SIGNOUT
  ];

  if (skipPaths.includes(req.originalUrl)) return next();

  validateSessionMiddleware(req, res, () => {
    generateMenuMiddleware(req, res, () => {
      setGlobalUserVariables(req, res, next);
    });
  });
});
```

**Critical Authentication Middleware Chain:**

This middleware runs on every request and performs three key operations:

1. **Session Validation** (`validateSessionMiddleware`):
   - Verifies JWT token from cookies
   - Validates token signature using public key
   - Checks token expiration
   - Redirects to login if invalid

2. **Dynamic Menu Generation** (`generateMenuMiddleware`):
   - Builds navigation menu based on user role and permissions
   - Determines which modules are accessible (PhishMagnus, AwareMagnus, etc.)
   - Stores menu structure in session

3. **Global Variables** (`setGlobalUserVariables`):
   - Makes user information available in all views
   - Sets `res.locals.user`, `res.locals.organization`, etc.

**Skipped Paths:** Login and logout routes bypass authentication to prevent redirect loops.

#### 13. **Layout Configuration** (Lines 120-121)

```javascript
app.use(expressLayouts);
app.set('layout', 'layout/layout_center');
```

**Enables layout system:**
- Uses `layout/layout_center.ejs` as the default master layout
- All pages inherit this layout unless specified otherwise
- Layout includes header, navigation, footer, and common scripts

#### 14. **Language Switcher Route** 

```javascript
app.post('/change-language', (req, res) => {
  const lang = req.body.lang;
  res.cookie('lang', lang, { maxAge: 900000, httpOnly: true });
  res.redirect(req.get('Referrer') || '/');
});
```

**Allows users to change language preference:**
- Accepts POST request with language code
- Stores preference in cookie
- Redirects back to previous page

#### 15. **Application Routes** 

```javascript
app.use('/', routes);
```

**Mounts all application routes** from [routes/routes.js](routes/routes.js), which includes:
- Product Suite routes (`/`)
- PhishMagnus routes (`/phm/*`)
- AwareMagnus routes (`/awm/*`)
- Authentication routes (login, logout, MFA)

See [Routes and API Endpoints](#routes-and-api-endpoints) section for detailed route information.

#### 16. **Error Handling** 

**404 Not Found Handler** (Lines 136-141):
```javascript
app.use((req, res) => {
  res.status(404).render('error_pages/404', {
    message: ['Page Not Found'],
    alertType: ['error']
  });
});
```

**Global Error Handler** 
```javascript
app.use((err, req, res, next) => {
  logger.error(err.stack || err.message || err);

  if (err.message && err.message.includes('Redis')) {
    return res.status(500).render('pages/login', {
      alertType: 'error',
      message: 'Session service unavailable. Please try again later.'
    });
  }

  if (req.accepts('html')) {
    return res.status(500).render('error_pages/500', {
      message: 'Internal Server Error'
    });
  }

  res.status(500).json({ error: err.message || 'Internal Server Error' });
});
```

**Error handling features:**
- Logs all errors using Winston logger
- Special handling for Redis connection errors
- Renders user-friendly error pages for HTML requests
- Returns JSON errors for API requests

#### 17. **Redis Connection and Server Startup**

```javascript
const redisClient = new Redis(config.REDIS_URL, {
  maxRetriesPerRequest: 2,
  reconnectOnError: (err) => {
    console.error('Redis connection error:', err);
    return false;
  }
});

redisClient.ping()
  .then((result) => {
    if (result === 'PONG') {
      logger.info('✅ Redis connection successful.');
      console.log('Connected to Redis successfully.');
      startServer(app, config, logger);
    } else {
      logger.error('❌ Redis ping failed:' + result);
      console.error('Failed to connect to Redis. Exiting application.');
      process.exit(1);
    }
  })
  .catch((err) => {
    logger.error('❌ Redis connection error:' + err.message);
    console.error('Redis connection error:', err);
    console.error('Failed to connect to Redis. Exiting application.');
    process.exit(1);
  });
```

**Critical Startup Sequence:**

1. **Redis Connection**: Establishes connection to Redis server using configuration from `.env`
2. **Health Check**: Sends PING command to verify Redis is responsive
3. **Conditional Server Start**:
   - **Success**: If Redis responds with 'PONG', starts the Express HTTP server via `startServer()`
   - **Failure**: If Redis is unavailable, logs error and exits the application with code 1

**Why Redis is Required:**
- **Session Storage**: User sessions must persist in Redis
- **Performance**: In-memory storage for fast session retrieval
- **Scalability**: Allows multiple server instances to share session data

**Error Handling:**
- Limited retry attempts (max 2) to fail fast
- Graceful shutdown if Redis is unavailable
- Prevents application from starting in an unstable state

#### 18. **Module Export** 

```javascript
module.exports = app;
```

Exports the configured Express app for testing purposes and programmatic usage.

---

### Startup Flow Diagram

```
┌─────────────────────────────────────────┐
│  1. Load Environment Variables (.env)   │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  2. Initialize Express Application      │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  3. Configure View Engine (EJS)         │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  4. Setup Static Asset Serving          │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  5. Apply Middleware (Body Parser,      │
│     Session, Flash, Logging, i18n)      │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  6. Setup Authentication & Authorization │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  7. Mount Application Routes            │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  8. Setup Error Handlers (404, 500)     │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  9. Connect to Redis                    │
└──────────────┬──────────────────────────┘
               │
       ┌───────┴────────┐
       │                │
       ▼                ▼
┌─────────────┐  ┌─────────────┐
│  SUCCESS    │  │   FAILURE   │
│  Redis PONG │  │  Exit (1)   │
└──────┬──────┘  └─────────────┘
       │
┌──────▼──────────────────────────────────┐
│  10. Start HTTP Server (PORT 8000)      │
└──────┬──────────────────────────────────┘
       │
┌──────▼──────────────────────────────────┐
│  ✅ Server listening at                 │
│     http://127.0.0.1:8000               │
└─────────────────────────────────────────┘
```

---

### Key Features Implemented in server.js

| Feature | Purpose | Configuration |
|---------|---------|---------------|
| **Health Check** | Service monitoring and load balancer integration | `GET /health` |
| **EJS Templating** | Server-side rendering with layouts | Multiple view directories |
| **Static Assets** | CSS, JS, images serving | `/securemagnus_2025/`, `/phishmagnus/` |
| **Session Management** | Redis-backed user sessions | `connect-redis`, `express-session` |
| **JWT Authentication** | Secure token-based auth | Cookie-stored JWT tokens |
| **Flash Messages** | One-time notifications | `connect-flash` |
| **Request Logging** | Audit trail and debugging | Winston logger with daily rotation |
| **i18n Support** | Multi-language interface | Cookie-based locale detection |
| **Permission-Based Access** | Role-based authorization | Dynamic menu and route protection |
| **Error Handling** | Graceful error pages | 404 and 500 error templates |
| **Redis Dependency** | Critical service validation | Ping test before server start |

---

### Important Notes

1. **Redis is Mandatory**: The application will not start if Redis is unavailable. Ensure Redis is running before starting the server.

2. **Environment Variables**: All configuration is loaded from `.env` file via [config/env.config.js](config/env.config.js).

3. **Middleware Order Matters**: Middleware is applied in a specific order. Changing the order may break functionality (e.g., session middleware must come before authentication).

4. **Security Considerations**:
   - JWT tokens are validated on every protected request
   - Sessions expire based on `COOKIE_JWT_TOKEN_EXPIRY` setting
   - HTTPS should be used in production for secure cookie transmission

5. **Logging**: All application logs are written to files specified in `LOGS_DIR` environment variable with daily rotation.

6. **Development vs Production**: Use `npm run development` for auto-restart on file changes (nodemon) or `npm start` for production mode.

---

### Required Information to Start the Application

Before starting [server.js](server.js), you must have the following information and resources configured:

#### 1. **Backend Services Information**

The frontend application **cannot function independently** - it requires a running backend service:

- **Service Suite Backend API URL**: The main backend server endpoint (e.g., `http://127.0.0.1:3000`)
  - Used for: User authentication, data management, business logic
  - Configured via: `BACKEND_EP` in `.env`
  - Validation: Frontend will make API calls to this endpoint on user actions

- **Service TVBS Backend URL**: The Test Vector Backend Service endpoint (e.g., `http://127.0.0.1:9000`)
  - Used for: Phishing campaign test vectors (email, SMS, QR, NFC, USB, WhatsApp)
  - Configured via: `BACKEND_TVBS_URL` in `.env`
  - Validation: Required for phishing simulations to function

**Critical**: Ensure both backend services are running and accessible before starting the frontend.

#### 2. **Redis Server Information**

Redis is a **mandatory dependency** - the application will refuse to start without a successful Redis connection:

- **Redis URL**: Complete connection string (e.g., `redis://127.0.0.1:6379`)
  - Configured via: `REDIS_URL` in `.env`
  - Also requires: `REDIS_SERVER_IP` and `REDIS_SERVER_PORT` separately

- **Redis Session Secret**: Shared secret key for session encryption
  - Configured via: `REDIS_SESSION_SECRET_KEY` in `.env`
  - **Must be identical** in both frontend and backend applications
  - Security: Use a strong, random string (e.g., `P@ssword123w` - change in production)

- **Redis Validation**: On startup, [server.js] performs:
  ```javascript
  redisClient.ping() // Must respond with 'PONG'
  ```
  - **Success**: Server starts and listens on configured port
  - **Failure**: Application exits with code 1

**Installation**:
- **Windows**: Install Redis via WSL (Windows Subsystem for Linux) - see [WSL and Redis Installation](../Wsl_Redis_Installation.md)
- **Linux**: `sudo apt install redis-server -y`
- **Verification**: Run `redis-cli ping` (should return `PONG`)

#### 3. **JWT Public Key**

The application validates JWT tokens using RSA public key cryptography:

- **Public Key File Path**: Location of the RSA public key file
  - Configured via: `BACKEND_SUITE_PUBLIC_KEY_PATH` in `.env`
  - Example: `C:\secure_magnus_workspace\keys\public.pem`

- **Key Requirements**:
  - Must be the **public key** corresponding to the private key used by the Service Suite backend
  - Must be in PEM format
  - Service Suite Backend generates JWT tokens with private key, frontend validates with Service Suite public key
  - Used by `validateSessionMiddleware` on every protected request


**Security**: Never share or expose the private key. Only the public key is needed on the frontend.

#### 4. **Workspace Directory**

The application requires a workspace directory for file storage:

- **Workspace Path**: Root directory for all file operations
  - Configured via: `SECURE_MAGNUS_WORKSPACE` in `.env`
  - Example: `c:\secure_magnus_workspace`

- **Directory Structure** (auto-created by application):
  ```
  secure_magnus_workspace/
  ├── keys/                          # RSA public/private keys
  ├── organizations/                 # Organization-specific folders
  │   ├── org_1/
  │   │   ├── templates/             # Email/SMS templates
  │   │   ├── phishing_files/        # Attachment files for campaigns
  │   │   ├── user_imports/          # CSV import files
  │   │   └── qr_codes/              # Generated QR code images
  ├── posters_library/               # Security awareness posters
  ├── system_templates/              # Global templates
  └── usb_executables/               # USB phishing payloads
  ```

- **Permissions Required**:
  - Read/Write access for the Node.js process
  - Sufficient disk space for file uploads (templates, attachments, QR codes)

#### 5. **Logging Configuration**

Winston logger requires configuration for file-based logging:

- **Log Directory**: Where log files will be stored
  - Configured via: `LOGS_DIR` in `.env`
  - Example: `C:\SecureMagnus\application logs`
  - Must exist and be writable by the Node.js process

- **Log File Prefix**: Identifier for log files
  - Configured via: `LOGS_FILENAME` in `.env`
  - Example: `"frontend"` creates files like `frontend-2025-01-11.log`

- **Log Rotation**: Winston automatically rotates logs daily
  - Old logs are preserved with date stamps
  - Configure retention policy as needed

#### 6. **Server Network Configuration**

Basic network settings for the HTTP server:

- **Host/IP Address**: Interface to bind to
  - Configured via: `HOST` in `.env`
  - Example: `127.0.0.1` (localhost only) or `0.0.0.0` (all interfaces)

- **Port Number**: HTTP listening port
  - Configured via: `PORT` in `.env`
  - Default: `8000`
  - Must not conflict with other services
  - Ensure firewall allows traffic on this port if needed

- **Environment Mode**: Determines application behavior
  - Configured via: `NODE_ENV` in `.env`
  - Values: `Development` or `Production`
  - Affects: Logging verbosity, error messages, performance optimizations

#### 7. **Session Configuration**

Session management parameters:

- **Session Expiry**: How long JWT tokens remain valid
  - Configured via: `COOKIE_JWT_TOKEN_EXPIRY` in `.env`
  - Value in minutes (e.g., `200` = 3 hours 20 minutes)
  - Affects: User session timeout
  - Balance: Security (shorter) vs User Experience (longer)

#### 8. **Internationalization (Optional)**

If multi-language support is needed:

- **Locale Files**: Translation files in [locales/](locales/) directory
  - Default language: English (en)
  - Additional languages: Configure in locale files
  - Language switching: Available via `/change-language` endpoint

---

### Pre-Start Checklist

Before running `npm run development` or `npm start`, verify:

- [ ] **Backend Services Running**
  - [ ] Main Backend API accessible at `BACKEND_EP` URL
  - [ ] TVBS Backend accessible at `BACKEND_TVBS_URL` URL
  - [ ] Test with: `curl http://127.0.0.1:3000/health` (or equivalent)

- [ ] **Redis Server Running**
  - [ ] Redis service started: `sudo service redis-server start` (Linux) or WSL (Windows)
  - [ ] Redis responding: `redis-cli ping` returns `PONG`
  - [ ] Redis accessible on `REDIS_SERVER_IP:REDIS_SERVER_PORT`

- [ ] **File System Ready**
  - [ ] Workspace directory exists: `SECURE_MAGNUS_WORKSPACE`
  - [ ] Public key file exists: `BACKEND_SUITE_PUBLIC_KEY_PATH`
  - [ ] Log directory exists: `LOGS_DIR`
  - [ ] Node.js process has read/write permissions

- [ ] **Environment File Configured**
  - [ ] `.env` file exists in project root
  - [ ] All required variables set (see [Configuration Setup](#configuration-setup))
  - [ ] Redis secret matches backend configuration
  - [ ] URLs and paths are correct for your environment

- [ ] **Dependencies Installed**
  - [ ] Run `npm install` to install all packages
  - [ ] No errors during installation
  - [ ] Node.js version compatible (v14+ recommended)

- [ ] **Port Availability**
  - [ ] Port `PORT` is not in use by another service
  - [ ] Test with: `netstat -ano | findstr :8000` (Windows) or `lsof -i :8000` (Linux)

---

### Startup Validation

When [server.js](server.js) starts successfully, you should see:

```bash
Connected to Redis successfully.
✅ Server Started
🚀 Server listening at http://127.0.0.1:8000
🚀 Healthcheck: http://127.0.0.1:8000/health
```

**Verify the application is running**:

1. **Health Check Endpoint**:
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

2. **Login Page**:
   - Open browser: `http://127.0.0.1:8000`
   - Should display Product Suite login page
   - Check browser console for errors

3. **Static Assets Loading**:
   - CSS and JavaScript files should load correctly
   - Check Network tab in browser DevTools
   - Verify no 404 errors for static resources

---

### Common Startup Issues and Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| `Failed to connect to Redis` | Redis server not running | Start Redis: `sudo service redis-server start` |
| `Redis connection error: ECONNREFUSED` | Wrong Redis host/port | Verify `REDIS_URL`, `REDIS_SERVER_IP`, `REDIS_SERVER_PORT` |
| `EADDRINUSE: port already in use` | Port conflict | Change `PORT` in `.env` or kill process using port |
| `Cannot find module` | Missing dependencies | Run `npm install` |
| `ENOENT: no such file or directory` | Missing workspace/key files | Create directories, verify paths in `.env` |
| Backend API errors | Backend not running | Start backend service first |
| JWT validation fails | Wrong public key | Ensure public key matches backend's private key |
| Session expires immediately | Wrong Redis secret | Match `REDIS_SESSION_SECRET_KEY` in frontend and backend |

---

## Folder Structure

```
suite_webapp/
├── awaremagnus/              # AwareMagnus module (Security Awareness Training)
│   ├── controllers/          # Request handlers for AwareMagnus features
│   ├── routes/               # Route definitions for AwareMagnus
│   └── views/                # EJS templates for AwareMagnus pages
│
├── phishmagnus/              # PhishMagnus module (Phishing Simulation)
│   ├── controllers/          # Request handlers for PhishMagnus features
│   ├── routes/               # Route definitions for PhishMagnus
│   ├── services/             # Business logic and API interactions
│   ├── utility/              # Helper functions and utilities
│   └── views/                # EJS templates for PhishMagnus pages
│
├── productsuite/             # Product Suite module (Core platform features)
│   ├── controllers/          # Request handlers for suite management
│   ├── routes/               # Route definitions for suite features
│   ├── services/             # Business logic and API interactions
│   ├── validators/           # Input validation schemas
│   └── views/                # EJS templates for suite pages
│
├── config/                   # Configuration files
│   ├── backend_api_urls.js   # Backend API endpoint definitions
│   ├── env.config.js         # Environment variable configuration
│   ├── frontend_api_urls.js  # Frontend route URL definitions
│   ├── render_ejs_urls.js    # EJS view rendering paths
│   └── system-config.env     # System-level configuration
│
├── contants/                 # Application constants (note: typo in folder name)
│   ├── ICONSTANTS.js         # HTTP status codes and role constants
│   ├── application-constants.js  # Workspace paths and application URLs
│   └── enum.js               # Enumeration definitions for business logic
│
├── commons/                  # Shared/common utilities and resources
│
├── locales/                  # Internationalization (i18n) translation files
│
├── logger/                   # Logging configuration and utilities
│
├── middleware/               # Express middleware functions
│   ├── jwt_authenticator/    # JWT token authentication
│   ├── menu/                 # Dynamic menu generation based on user roles
│   └── session_management/   # Session handling and validation
│
├── public/                   # Static assets (CSS, JS, images)
│   └── securemagnus_2025/    # Public assets for the application
│
├── routes/                   # Main application route aggregator
│
├── utility/                  # Global utility functions and helpers
│
├── views/                    # Shared EJS templates
│   ├── layout/               # Layout templates (master pages)
│   ├── error_pages/          # Error page templates (404, 500, etc.)
│   └── pages/                # Common page templates
│
├── .env                      # Environment variables (not committed to version control)
├── package.json              # Project dependencies and scripts
└── server.js                 # Main application entry point
```

---

## Constants Files

The application uses three main constant files located in the [contants/](contants/) folder:

### 1. [ICONSTANTS.js](contants/ICONSTANTS.js)

**Purpose:** Defines HTTP status codes, user role IDs, and payment/subscription status codes.

**Key Constants:**
- **User Roles:**
  - `MagSuperAdmin`: 1 - Magnus Super Administrator
  - `MagSubAdmin`: 2 - Magnus Sub Administrator
  - `OrgSuperAdmin`: 3 - Organization Super Administrator
  - `OrgSubAdmin`: 4 - Organization Sub Administrator
  - `OrgUser`: 5 - Organization User
  - `Guest`: 6 - Guest User

- **HTTP Status Codes:**
  - `HTTP_OK`: 200
  - `HTTP_CREATED`: 201
  - `HTTP_BAD_REQUEST`: 400
  - `HTTP_UnAuthorized`: 401
  - `HTTP_NOT_FOUND`: 404
  - `HTTP_INTERNAL_SERVER`: 500

- **Order/Subscription Status:**
  - `CreateOrder`: 700
  - `PendingInvoice`: 701
  - `UpdateInvoice`: 702
  - `PAID`: 703
  - `SubExpired`: 703
  - `SubDeActive`: 704

### 2. [application-constants.js](contants/application-constants.js)

**Purpose:** Manages workspace directory paths, TVBS (Test Vector Backend Service) routing, and application-level configuration.

**Key Constants:**
- **Workspace Folder Names:**
  - Organization folders, template storage, phishing file storage, QR code storage, etc.

- **TVB Routes:** URL patterns for different phishing vectors
  - NFC: `/fc`
  - QR: `/rq`
  - EMAIL: `/em`
  - SMS: `/ms`
  - Whatsapp: `/wp`
  - USB: `/sb`

- **Configuration Values:**
  - `QR_CODE_STORAGE_DIR`: QR code storage directory path
  - `POSTERS_LIBRARY_DIR`: Poster library directory path
  - `PHISHMAGNUS_USERS_IMPORT_FILES`: User import files directory
  - `BACKEND_TVBS_URL`: Backend TVBS service URL
  - `COOKIE_JWT_TOKEN_EXPIRY`: JWT token expiration time

### 3. [enum.js](contants/enum.js)

**Purpose:** Contains enumeration definitions for business logic including file types, phishing types, payment statuses, user types, and module access controls.

**Key Enumerations:**
- **File Types:** Document, PDF, Excel, DOS, JavaScript
- **Phishing Types:** SMS, Email, USB, Whatsapp, QR, NFC
- **Payment Status:** BankProgress, Unpaid, Paid, InProgress, Disputed, Cancelled, Free
- **Order Status:** CreateOrder, PendingInvoice, GenerateInvoice, Active, Cancelled, etc.
- **User Types:** MagSuperAdmin, MagSubAdmin, OrgSuperAdmin, OrgSubAdmin, OrgUser, GuestUser
- **Service Types:** Phishing variants, LMS, and combined services
- **Phishing Categories:** SimplePhishing, AttachmentBasedPhishing, ClickURLPhishing, DataEntryBasedPhishing
- **Module Names:** Application modules like User_Management, Campaign_Management, Department, etc.
- **Access Types:** Permission levels (RWD-ALL, RW-ALL, R-ALL, No, R-O, RW-O, etc.)
- **Product Selection:** All, PhishMagnus, AwareMagnus, GRC
- **Campaign Upload Status:** InstantCampaign, TestCampaign, NFC_Campaign, QR_Campaign, Pending, Completed

---

## Dependencies

This project uses the following npm packages:

### Core Framework & Server
- **express** (^4.19.2) - Web application framework
- **ejs** (^3.1.9) - Templating engine for views
- **express-ejs-layouts** (^2.5.1) - Layout support for EJS
- **body-parser** (^1.20.2) - Request body parsing middleware
- **cookie-parser** (^1.4.6) - Cookie parsing middleware
- **cors** (^2.8.5) - Cross-origin resource sharing
- **dotenv** (^16.4.4) - Environment variable management
- **dotenv-flow** (^4.1.0) - Environment-specific .env file loading

### Session & Authentication
- **express-session** (^1.18.0) - Session management
- **connect-redis** (^8.1.0) - Redis session store
- **ioredis** (^5.6.1) - Redis client for session storage
- **jsonwebtoken** (^9.0.2) - JWT token generation and validation
- **connect-flash** (^0.1.1) - Flash messages for user notifications

### Validation & Security
- **express-validator** (^7.0.1) - Input validation and sanitization
- **ajv** (^8.12.0) - JSON schema validator
- **he** (^1.2.0) - HTML entity encoding/decoding

### HTTP Client & API
- **axios** (^1.6.7) - Promise-based HTTP client for backend API calls
- **node-fetch** (^2.7.0) - Fetch API for Node.js
- **form-data** (^4.0.0) - Multipart/form-data handling

### File Processing & Upload
- **express-fileupload** (^1.5.0) - File upload middleware
- **multer** (^1.4.5-lts.1) - File upload handling
- **csv-parser** (^3.0.0) - CSV file parsing
- **archiver** (^7.0.1) - File archiving and compression
- **mime-types** (^2.1.35) - MIME type detection

### PDF & Image Processing
- **html-pdf** (^3.0.1) - HTML to PDF conversion
- **pdfkit** (^0.15.0) - PDF generation
- **pdf-lib** (^1.17.1) - PDF manipulation
- **puppeteer** (^22.14.0) - Headless browser for PDF generation and web scraping
- **jimp** (^0.16.1) - Image processing
- **sharp** (^0.33.5) - High-performance image processing
- **qrcode** (^1.5.4) - QR code generation

### Data Visualization & Charts
- **chart.js** (^4.4.7) - JavaScript charting library

### Database
- **sequelize** (^6.37.0) - ORM for SQL databases
- **mssql** (^10.0.2) - Microsoft SQL Server client

### Internationalization & Localization
- **i18n** (^0.15.1) - Internationalization support for multi-language applications

### Logging
- **winston** (^3.12.0) - Logging library
- **winston-daily-rotate-file** (^5.0.0) - Daily rotating file transport for logs

### Utilities
- **moment** (^2.30.1) - Date and time manipulation
- **crypto** (^1.0.1) - Cryptographic operations
- **fs** (^0.0.1-security) - File system operations

### Styling
- **tailwindcss** (^4.1.11) - Utility-first CSS framework
- **@tailwindcss/vite** (^4.1.11) - Vite plugin for Tailwind CSS

### Development Dependencies
- **nodemon** (^3.0.3) - Auto-restart server on file changes during development
- **javascript-obfuscator** (^4.1.1) - Code obfuscation for production
- **cross-env** (^10.1.0) - Cross-platform environment variable setting

---

## Routes and API Endpoints

The application follows a modular routing structure with three main route groups:

### Route Structure Overview

```
Base URL: http://127.0.0.1:8000

├── /                          # Product Suite Routes (Protected)
├── /phm/*                     # PhishMagnus Routes (Protected)
└── /awm/*                     # AwareMagnus Routes (Protected - Currently disabled)
```

All protected routes require JWT authentication via cookies. Authentication is handled by the `jwt-authenticate-middleware`.

---

### Authentication Routes

#### Login Routes
```
GET  /                         # Product Suite Login (Default)
GET  /login                    # Product Suite Login Page
POST /login                    # Product Suite Login Submit

GET  /phm/login                # PhishMagnus Login Page
POST /phm/login                # PhishMagnus Login Submit

GET  /awm/login                # AwareMagnus Login Page (Commented)
```

#### Logout
```
GET  /logout                   # Sign out and clear session
POST /logout                   # Sign out (POST method)
```

#### Multi-Factor Authentication (MFA)
```
GET  /mfa                      # MFA verification page
POST /mfa/verify               # Verify MFA code
```

---

### Product Suite Routes

Base path: `/`

All Product Suite routes are protected and require authentication.

#### Home & Dashboard
```
GET  /home                     # Dashboard home page
GET  /suite_management_dashboard  # Suite management dashboard
```

#### User Management
```
GET  /user/suite-users                    # List all suite users
GET  /user/securemagnus-users             # List SecureMagnus users
GET  /user/create                         # Create user form
POST /user/create                         # Submit new user
GET  /user/show/:userId                   # View/Edit specific user
POST /user/update/:userId                 # Update user details
DELETE /user/delete/:userId               # Delete user

GET  /user/securemagnus-users/create      # Create SecureMagnus user form
POST /user/securemagnus-users/create      # Submit SecureMagnus user
```

**Sample User API Request:**
```javascript
// Backend API: GET /user/suite-users/:organizationId
// Frontend Route: GET /user/suite-users

// Response Example:
{
  "status": "success",
  "users": [
    {
      "id": 1,
      "username": "john.doe",
      "email": "john@example.com",
      "role": "OrgAdmin",
      "organization": "Acme Corp"
    }
  ]
}
```

#### Service Registry
```
GET  /service-registry/                   # List all services
GET  /service-registry/create             # Create service form
POST /service-registry/create             # Submit new service
GET  /service-registry/update/:serviceId  # Edit service form
POST /service-registry/update/:serviceId  # Update service
DELETE /service-registry/delete/:serviceId # Delete service
```

#### Organization Management
```
GET  /organization/list                   # List organizations
GET  /organization/profile/:orgId         # View organization profile
POST /organization/create                 # Create new organization
POST /organization/update/:orgId          # Update organization
DELETE /organization/delete/:orgId        # Delete organization
```

#### Subscription & Orders
```
GET  /subscription/create/:orgId          # Create subscription
POST /subscription/create/:orgId          # Submit subscription
GET  /subscription/list                   # List subscriptions

GET  /order/list                          # List orders
POST /order/create                        # Create order
POST /order/update-invoice/:orgId/:subId/:orderId  # Update invoice
```

#### System Templates
```
GET  /template/list                       # List all templates
GET  /template/create                     # Create template form
POST /template/create                     # Submit new template
GET  /template/edit/:templateId           # Edit template
POST /template/update/:templateId         # Update template
DELETE /template/delete/:templateId       # Delete template
GET  /template/duplicate/:templateId/:orgId  # Clone template
```

#### Department Management
```
GET  /department/list                     # List departments
POST /department/create                   # Create department
POST /department/update/:deptId           # Update department
DELETE /department/delete/:deptId         # Delete department
```

#### Group Management
```
GET  /group/list                          # List groups
POST /group/create                        # Create group
POST /group/update/:groupId               # Update group
DELETE /group/delete/:groupId             # Delete group
```

#### SMTP Settings
```
GET  /settings/smtp                       # SMTP configuration page
POST /settings/smtp/create                # Create SMTP config
POST /settings/smtp/update/:orgId         # Update SMTP config
```

#### Audit Logs
```
GET  /audit                               # View audit logs
GET  /audit?startDate=2024-01-01&endDate=2024-12-31  # Filtered logs
```

#### Cybersecurity
```
GET  /cybersecurity/categories            # List categories
POST /cybersecurity/categories/create     # Create category
POST /cybersecurity/filePostersUpload     # Upload poster files
```

#### License Management
```
GET  /license/information                 # License information
GET  /license/retrieve/information/:productKey  # Get product license
```

---

### PhishMagnus Routes

Base path: `/phm`

All PhishMagnus routes are protected and require authentication.

#### Dashboard
```
GET  /phm/index                           # PhishMagnus dashboard
```

#### Campaign Management - Email
```
GET  /phm/campaign/email/list             # List email campaigns
GET  /phm/campaign/email/create           # Create email campaign
POST /phm/campaign/email/create           # Submit email campaign
GET  /phm/campaign/details/:campaignId    # View campaign report
DELETE /phm/campaign/email/delete/:campaignId  # Delete campaign
```

**Sample Campaign API Request:**
```javascript
// Frontend Route: POST /phm/campaign/email/create
// Backend API: POST /phm/campaign/create

// Request Body:
{
  "campaignName": "Q1 Security Awareness Test",
  "templateId": 5,
  "groupId": 3,
  "scheduledDate": "2024-02-15T10:00:00Z",
  "phishingType": 2,  // Email
  "organizationId": 10
}

// Response:
{
  "status": "success",
  "message": "Campaign created successfully",
  "campaignId": 123
}
```

#### Campaign Management - SMS
```
GET  /phm/campaign/sms/list               # List SMS campaigns
GET  /phm/campaign/sms/create             # Create SMS campaign
POST /phm/campaign/sms/create             # Submit SMS campaign
GET  /phm/campaign/sms/report/campaign/:campaignId  # SMS campaign report
```

#### Campaign Management - WhatsApp
```
GET  /phm/campaign/whatsapp/create        # Create WhatsApp campaign
POST /phm/campaign/whatsapp/create        # Submit WhatsApp campaign
GET  /phm/campaign/whatsapp/report        # List WhatsApp reports
GET  /phm/campaign/whatsapp/report/campaign/:campaignId  # WhatsApp report
```

#### Campaign Management - QR Code
```
GET  /phm/campaign/qr/create              # Create QR campaign
POST /phm/campaign/qr/create              # Submit QR campaign
GET  /phm/campaign/qr/list                # List QR campaigns
GET  /phm/campaign/qr/details/:campaignId # QR campaign details
GET  /phm/campaign/qr/download/:qrCode    # Download QR code image
```

**Sample QR Campaign Response:**
```javascript
// Frontend Route: GET /phm/campaign/qr/details/:campaignId
// Returns campaign details with QR codes

{
  "campaignId": 45,
  "campaignName": "Reception Area QR Test",
  "qrCodes": [
    {
      "qrCodeId": "QR_20240115_001",
      "filePath": "/qr_code_storage/QR_20240115_001.png",
      "scannedCount": 23,
      "targetUrl": "http://127.0.0.1:9000/rq?inv=ABC123&cid=45"
    }
  ]
}
```

#### Campaign Management - NFC
```
GET  /phm/campaign/nfc/create             # Create NFC campaign
POST /phm/campaign/nfc/create             # Submit NFC campaign
GET  /phm/campaign/nfc/report             # NFC campaign reports
```

#### Campaign Management - USB
```
GET  /phm/campaign/usb/                   # Create USB campaign
POST /phm/campaign/usb/create             # Submit USB campaign
GET  /phm/campaign/usb/report             # USB campaign reports
```

#### All Campaigns & Reports
```
GET  /phm/campaign/all-campaigns          # View all campaigns
GET  /phm/campaign/reports                # View all campaign reports
```

#### Template Management
```
GET  /phm/template/list                   # List PhishMagnus templates
GET  /phm/template/create                 # Create template form
POST /phm/template/create                 # Submit new template
GET  /phm/template/edit/:templateId       # Edit template
POST /phm/template/update/:templateId     # Update template
DELETE /phm/template/delete/:templateId   # Delete template
GET  /phm/template/view/:templateId       # View template details
```

#### Department & Groups
```
GET  /department/list                     # List departments
GET  /group/list                          # List groups
```

#### Common Functions
```
GET  /phm/commons/*                       # Common utility endpoints
```

#### File Management
```
POST /phm/file/upload                     # Upload files for campaigns
GET  /phm/file/download/:fileId           # Download campaign files
```

---

### Backend API Integration

The frontend communicates with the backend through defined API URLs in [config/backend_api_urls.js](config/backend_api_urls.js).

**Backend Base URL:** `http://127.0.0.1:3000` (configured via `BACKEND_EP` in `.env`)

#### API Request Pattern:

```javascript
// Example: Fetching users
const axios = require('axios');
const BackendAPI = require('./config/backend_api_urls');

// GET request
const response = await axios.get(
  BackendAPI.BASE_API_URL + BackendAPI.PRODUCT_SUITE.User_Management.LIST_SUITE_USERS(orgId),
  {
    headers: {
      'Authorization': `Bearer ${jwtToken}`,
      'Content-Type': 'application/json'
    }
  }
);

// POST request
const createUser = await axios.post(
  BackendAPI.BASE_API_URL + '/user/create',
  {
    username: 'newuser',
    email: 'newuser@example.com',
    role: 'OrgUser'
  },
  {
    headers: {
      'Authorization': `Bearer ${jwtToken}`,
      'Content-Type': 'application/json'
    }
  }
);
```

---

### TVBS (Test Vector Backend Service) Routes

The TVBS service handles phishing test vector URLs on a separate backend (default: `http://127.0.0.1:9000`).

#### TVBS URL Patterns:

```
# NFC Campaign
GET  /fc?inv=<inviteeId>&cid=<campaignId>&ifc=<nfcDeviceCode>

# QR Code Campaign
GET  /rq?inv=<inviteeId>&cid=<campaignId>

# Email Campaign
GET  /em?inv=<inviteeId>&cid=<campaignId>
GET  /em/ourl?inv=<inviteeId>&cid=<campaignId>      # Open URL tracking
GET  /em/aurl?inv=<inviteeId>&cid=<campaignId>      # Attachment URL tracking
GET  /em/dfurl?inv=<inviteeId>&cid=<campaignId>     # Download file URL

# SMS Campaign
GET  /ms?inv=<inviteeId>&cid=<campaignId>

# WhatsApp Campaign
GET  /wp?inv=<inviteeId>&cid=<campaignId>

# USB Campaign
GET  /sb?inv=<inviteeId>&cid=<campaignId>
```

**Query Parameters:**
- `inv`: Invitee ID (encrypted identifier for the target user)
- `cid`: Campaign ID
- `ifc`: NFC Device Code (for NFC campaigns)

---

### Permission-Based Access Control

Routes are protected using the `checkPermission` middleware that validates user permissions based on:

- **Module Names** (from [enum.js](contants/enum.js)):
  - `User_Management`
  - `Campaign_Management`
  - `Campaign_Reports`
  - `Template_Management`
  - etc.

- **Access Types** (from [enum.js](contants/enum.js)):
  - `RWD-ALL`: Read, Write, Delete All
  - `RW-ALL`: Read, Write All
  - `R-ALL`: Read All
  - `RWD-O`: Read, Write, Delete Own
  - `RW-O`: Read, Write Own
  - `R-O`: Read Own

**Example Usage:**
```javascript
// Only users with read access to Campaign_Reports can access this route
router.get('/campaign/reports',
  checkPermission('Campaign_Reports', ['R-ALL', 'R-O']),
  renderAllReports
);
```

---

### Error Handling

The application includes error handling for common scenarios:

```
404 - Page Not Found
GET  /*  (unmatched routes) → renders error_pages/404

500 - Internal Server Error
Any unhandled exception → renders error_pages/500
```

---

## EJS Views, Templates & Static Assets

The application uses **EJS (Embedded JavaScript)** as the templating engine with **Tailwind CSS** for styling. All views are server-side rendered with dynamic data injection.

### View Engine Configuration

The application is configured to use EJS with layouts:

```javascript
// In server.js
app.set('view engine', 'ejs');
app.set('views', [
  path.join(__dirname, 'views'),
  path.join(__dirname, 'productsuite', 'views'),
  path.join(__dirname, 'phishmagnus', 'views'),
]);

app.use(expressLayouts);
app.set('layout', 'layout/layout_center');
```

---

### Layout System

The application uses a master layout pattern with **express-ejs-layouts** for consistent page structure.

#### Master Layout: [layout_center.ejs](views/layout/layout_center.ejs)

**Structure:**
```
layout_starting.ejs    → HTML head, meta tags, CSS imports
  ↓
layout_left_navbar.ejs → Left sidebar navigation
  ↓
layout_top_navbar.ejs  → Top navigation bar with user info
  ↓
[PAGE CONTENT]         → Individual page content (<%- body %>)
  ↓
layout_ending.ejs      → Closing tags, global scripts
```

**Key Features:**
- Responsive design using Tailwind CSS
- Dynamic navigation based on user roles
- Flash message system for notifications
- Toast notifications
- Internationalization (i18n) support
- Security meta tags to prevent crawling

#### Layout Files

1. **[layout_starting.ejs](views/layout/layout_starting.ejs)**
   - HTML document start
   - Meta tags (charset, viewport, robots/crawler blocking)
   - External CSS/Font imports (Font Awesome, Google Fonts)
   - Static asset links
   - Global JavaScript libraries

2. **[layout_left_navbar.ejs](views/layout/layout_left_navbar.ejs)**
   - Left sidebar with module navigation
   - Dynamic menu generation based on permissions
   - Module icons and links

3. **[layout_top_navbar.ejs](views/layout/layout_top_navbar.ejs)**
   - Top navigation bar
   - User profile dropdown
   - Logout button
   - Language selector

4. **[layout_ending.ejs](views/layout/layout_ending.ejs)**
   - Closing HTML tags
   - Global JavaScript includes
   - Page-specific script injection

---

### View Directory Structure

```
views/
├── layout/                          # Master layout templates
│   ├── layout_center.ejs            # Main layout wrapper
│   ├── layout_starting.ejs          # HTML head & CSS imports
│   ├── layout_left_navbar.ejs       # Left sidebar navigation
│   ├── layout_top_navbar.ejs        # Top navigation bar
│   └── layout_ending.ejs            # Closing tags & scripts
│
└── error_pages/                     # Error page templates
    ├── 404.ejs                      # Page not found
    └── 500.ejs                      # Internal server error

productsuite/views/
├── pages/
│   ├── login/
│   │   ├── psm_login.ejs            # Product Suite login page
│   │   └── change_password.ejs     # Change password page
│   │
│   ├── user_management/
│   │   ├── list-user.ejs            # User listing table
│   │   ├── create-user.ejs          # Create new user form
│   │   └── edit-user.ejs            # Edit user form
│   │
│   ├── organization/
│   │   ├── create-organization.ejs  # Organization creation
│   │   ├── organization-profile.ejs # Organization details
│   │   └── branding.ejs             # Organization branding
│   │
│   ├── order/
│   │   ├── order.ejs                # Order management
│   │   └── invoice.ejs              # Invoice generation
│   │
│   ├── audit/
│   │   └── view-logs.ejs            # Audit log viewer
│   │
│   ├── mfa/
│   │   ├── create.ejs               # MFA setup
│   │   └── mfa-login.ejs            # MFA verification
│   │
│   └── app_service/
│       ├── create_app_service.ejs   # Service creation
│       └── list_app_service.ejs     # Service listing

phishmagnus/views/
├── layout/
│   ├── campaign-types-modal.ejs     # Campaign type selector modal
│   └── new-campaign-types-modal.ejs # New campaign modal
│
└── pages/
    ├── login/
    │   └── phm_login.ejs            # PhishMagnus login
    │
    ├── campaign/
    │   ├── all-campaigns.ejs        # All campaigns overview
    │   │
    │   ├── email-campaign/
    │   │   ├── create.ejs           # Email campaign wizard
    │   │   ├── selectTemplate.ejs   # Template selection step
    │   │   ├── selectDepartmentGroup.ejs # Target selection
    │   │   ├── selectDateTime.ejs   # Schedule selection
    │   │   ├── email-campaign-report.ejs # Campaign analytics
    │   │   └── emailUserReport.ejs  # Individual user report
    │   │
    │   ├── sms-campaign/
    │   │   ├── createSMSCampaign.ejs
    │   │   ├── selectTemplate.ejs
    │   │   └── campaign-report.ejs
    │   │
    │   ├── qr-campaign/
    │   │   ├── createQRCampaign.ejs
    │   │   ├── selectPoster.ejs
    │   │   └── qr-campaign-report.ejs
    │   │
    │   ├── nfc-campaign/
    │   │   ├── createNFCCampaign.ejs
    │   │   ├── selectTagQuantity.ejs
    │   │   └── campaign-report.ejs
    │   │
    │   ├── usb-campaign/
    │   │   ├── createUSBCampaign.ejs
    │   │   └── usb-campaign-report.ejs
    │   │
    │   └── whatsapp-campaign/
    │       ├── createWhatsAppCampaign.ejs
    │       └── campaign-report.ejs
    │
    ├── template/
    │   ├── list-templates.ejs       # Template library
    │   ├── create-template.ejs      # Template editor
    │   └── edit-template.ejs        # Template modification
    │
    └── dashboard/
        └── phm_dashboard.ejs        # PhishMagnus dashboard
```

---

### Static Assets Structure

All static assets are served from [public/securemagnus_2025/](public/securemagnus_2025/) and accessible via the `/securemagnus_2025/` URL prefix.

#### CSS Files ([public/securemagnus_2025/css/](public/securemagnus_2025/css/))

```
css/
├── style.css            # Main application styles (12.8 KB)
├── dashboard.css        # Dashboard-specific styles (15.5 KB)
├── data_table.css       # DataTables styling (279 KB)
├── dt.css               # Alternative DataTable styles (279 KB)
├── samples.css          # Sample/demo page styles (67.3 KB)
├── sidebar.css          # Sidebar navigation styles (837 B)
└── neo.css              # Additional modern UI styles (851 B)
```

**CSS Framework:**
- **Tailwind CSS** (v4.1.11) - Primary utility-first CSS framework
- Custom CSS for specific components
- DataTables CSS for table interactions
- Responsive design with mobile-first approach

**Usage Example:**
```html
<!-- In layout_starting.ejs -->
<link rel="stylesheet" href="/securemagnus_2025/css/style.css">
<link rel="stylesheet" href="/securemagnus_2025/css/data_table.css">
```

---

#### JavaScript Files ([public/securemagnus_2025/js/](public/securemagnus_2025/js/))

```
js/
├── jquery.js                              # jQuery library (93 KB)
├── data_table.js                          # DataTables plugin (255 KB)
├── chart.js                               # Chart.js wrapper (2.8 KB)
├── chart.umd.js.map                       # Chart.js source map (953 KB)
│
├── Custom Campaign Scripts:
│   ├── email_campaign_form_stepper.js     # Email campaign wizard (19.5 KB)
│   ├── email_camp_table.js                # Email campaign table (11.8 KB)
│   ├── email_phishing_campaign_report.js  # Email report analytics (8.7 KB)
│   ├── jqueryEmailCreateCampaign.js       # Email creation helpers (14.8 KB)
│   ├── form_stepper.js                    # Multi-step form logic (9.3 KB)
│   ├── JQuery_usb_phishing_campaign_report.js # USB report (1.1 KB)
│
├── Dashboard & Analytics:
│   ├── dsashboard.js                      # Dashboard functionality (4.9 KB)
│   ├── index.js                           # Main app initialization (14.2 KB)
│
├── Data Management:
│   ├── audit_log_table_jquery.js          # Audit log table (10 KB)
│
├── UI Components:
│   ├── icons.js                           # Icon utilities (830 B)
│
├── External Libraries:
│   ├── jquery.validate/                   # jQuery Validation plugin
│   ├── chart.js-4.5.0/                    # Chart.js library (v4.5.0)
│   └── tailwind.js                        # Tailwind CSS CDN
│
└── custom_script/                         # Custom JavaScript modules
```

**Key JavaScript Libraries:**

1. **jQuery** (v3.x) - DOM manipulation and AJAX
2. **DataTables** - Interactive table features (sorting, filtering, pagination)
3. **Chart.js** (v4.5.0) - Data visualization and analytics charts
4. **jQuery Validate** - Form validation
5. **ApexCharts** - Advanced charting (loaded via CDN)
6. **Tailwind CSS** - Utility-first CSS framework
7. **CKEditor** - Rich text editor for templates

**Usage Example:**
```html
<!-- Global scripts in layout_starting.ejs -->
<script src="/securemagnus_2025/js/jquery.js"></script>
<script src="/securemagnus_2025/ckeditor/ckeditor.js"></script>
<script src="https://cdn.jsdelivr.net/npm/apexcharts"></script>

<!-- Page-specific script -->
<script src="/securemagnus_2025/js/email_campaign_form_stepper.js"></script>
```

---

#### Images & Icons ([public/securemagnus_2025/images/](public/securemagnus_2025/images/))

```
images/
├── Branding:
│   ├── awaremagnuslogin.png               # AwareMagnus login logo (606 KB)
│   ├── awaremagnuslogin.svg               # AwareMagnus logo vector (581 KB)
│   ├── awarenessMagnus-logo.svg           # AwareMagnus icon (13.8 KB)
│   ├── phishmagnuslogo.svg                # PhishMagnus logo
│   └── favicon.ico                        # Browser favicon (6.3 KB)
│
├── Campaign Icons (SVG):
│   ├── champaign.svg                      # Campaign icon (1.6 KB)
│   ├── champaignLog.svg                   # Campaign log icon (1.1 KB)
│   ├── active-camp.svg                    # Active campaign (810 B)
│   ├── calendar-schedule-checkmark.svg    # Schedule icon (1.2 KB)
│   ├── calanderblue.svg                   # Blue calendar (780 B)
│   ├── calanderteal.svg                   # Teal calendar (843 B)
│
├── Attachment Icons:
│   ├── attach.svg                         # Attachment icon (983 B)
│   ├── attachment.svg                     # Generic attachment (917 B)
│   ├── attachment-open.svg                # Opened attachment (819 B)
│   └── attachmentopened.svg               # Attachment opened state (819 B)
│
├── UI Icons:
│   ├── browser-web-checkmark.svg          # Browser check (1 KB)
│   ├── Basket.svg                         # Shopping basket (1.1 KB)
│   └── bank.png                           # Bank icon (6.4 KB)
│
└── Other Assets:
    └── [100+ additional SVG/PNG icons for UI elements]
```

**Icon Usage:**
- SVG format for scalability and small file sizes
- PNG format for complex images and logos
- Icons organized by feature/module

**Example:**
```html
<!-- In EJS template -->
<img src="/securemagnus_2025/images/champaign.svg" alt="Campaign" class="w-6 h-6">
```

---

#### Additional Asset Directories

**CKEditor** ([public/securemagnus_2025/ckeditor/](public/securemagnus_2025/ckeditor/))
- Rich text editor for email template creation
- Plugins: exportpdf, scayt (spell check)
- Customizable toolbar and configurations

**CanvasJS** ([public/securemagnus_2025/canvasjs/](public/securemagnus_2025/canvasjs/))
- Advanced charting library
- Used for campaign analytics and reports

**Menu Component** ([public/securemagnus_2025/menu-component/](public/securemagnus_2025/menu-component/))
- Dynamic menu generation components
- Role-based navigation elements

---

### EJS Template Patterns

#### 1. **Layout Inheritance**

```ejs
<!-- Master layout (layout_center.ejs) -->
<%- include('layout/layout_starting.ejs') %>
<%- include('layout/layout_left_navbar.ejs') %>

<main class="flex-1 overflow-y-auto">
  <%- include('layout/layout_top_navbar') %>
  <%- body %>  <!-- Page content injected here -->
</main>

<%- include('layout/layout_ending.ejs') %>
```

#### 2. **Partials (Reusable Components)**

```ejs
<!-- Include a partial -->
<%- include('../layout/campaign-types-modal') %>

<!-- Pass data to partial -->
<%- include('components/user-card', { user: currentUser }) %>
```

#### 3. **Data Rendering**

```ejs
<!-- Render dynamic data -->
<h1>Welcome, <%= username %>!</h1>

<!-- Conditional rendering -->
<% if (typeof message !== 'undefined' && message) { %>
  <div class="alert"><%= message %></div>
<% } %>

<!-- Loop through array -->
<% campaigns.forEach(campaign => { %>
  <div class="campaign-card">
    <h3><%= campaign.name %></h3>
    <p><%= campaign.description %></p>
  </div>
<% }) %>
```

#### 4. **Localization (i18n)**

```ejs
<!-- Current locale -->
<html lang="<%= locale %>" dir="<%= locale === 'ar' ? 'rtl' : 'ltr' %>">

<!-- Translated text -->
<%= __('Welcome') %>
<%= __('dashboard.title') %>
```

#### 5. **Form Handling**

```ejs
<!-- Form with CSRF protection -->
<form method="POST" action="/user/create">
  <input type="text" name="username" required>
  <input type="email" name="email" required>

  <select name="role">
    <option value="OrgUser">User</option>
    <option value="OrgAdmin">Admin</option>
  </select>

  <button type="submit">Create User</button>
</form>
```

#### 6. **Flash Messages & Toasts**

```ejs
<!-- Toast notification system -->
<%
  const toastMessage = (Array.isArray(message) && message.length > 0) ? message[0] : null;
  const toastAlertType = (Array.isArray(alertType) && alertType.length > 0) ? alertType[0] : 'info';
%>

<% if (toastMessage) { %>
  <script>
    showCustomToast('<%- toastAlertType %>', '<%- toastMessage %>');
  </script>
<% } %>
```

---

### Responsive Design

The application uses **Tailwind CSS** utility classes for responsive design:

```html
<!-- Mobile-first responsive classes -->
<div class="
  w-full           <!-- Full width on mobile -->
  md:w-1/2         <!-- Half width on tablet -->
  lg:w-1/3         <!-- Third width on desktop -->
  max-sm:h-full    <!-- Full height on small screens -->
  lg:rounded-3xl   <!-- Rounded corners on large screens -->
">
  <!-- Content -->
</div>
```

**Breakpoints:**
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

---

### Security Considerations

**EJS views implement several security measures:**

1. **XSS Prevention:**
   ```ejs
   <%= userInput %>  <!-- Auto-escapes HTML -->
   <%- htmlContent %> <!-- Unescaped (use with caution) -->
   ```

2. **Crawler Blocking:**
   ```html
   <meta name="robots" content="noindex, nofollow, noarchive, nosnippet">
   ```

3. **Content Security:**
   - Sanitized user inputs
   - Escaped special characters in JavaScript
   - HTML entity encoding

---

### Asset Loading Strategy

**CSS Loading (Head):**
```html
<!-- External CDN -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

<!-- Local static files -->
<link rel="stylesheet" href="/securemagnus_2025/css/style.css">
<link rel="stylesheet" href="/securemagnus_2025/css/data_table.css">
```

**JavaScript Loading (Bottom):**
```html
<!-- Core libraries first -->
<script src="/securemagnus_2025/js/jquery.js"></script>

<!-- Plugins -->
<script src="/securemagnus_2025/js/data_table.js"></script>
<script src="/securemagnus_2025/ckeditor/ckeditor.js"></script>

<!-- Page-specific scripts last -->
<script src="/securemagnus_2025/js/email_campaign_form_stepper.js"></script>
```

---

## Environment Configuration

The application uses a `.env` file for environment-specific configuration. Create a `.env` file in the root directory with the following variables:

### Application Settings

```env
# Environment mode (Development/Production)
NODE_ENV=Development

# Server configuration
HOST=127.0.0.1
PORT=8000
```

### Backend Service Configuration

```env
# Main backend API endpoint
BACKEND_EP=http://127.0.0.1:3000

# Backend TVBS (Test Vector Backend Service) Configuration
BACKEND_TVBS_URL=http://127.0.0.1:9000
```

### Redis Configuration

```env
# Redis connection URL
REDIS_URL=redis://127.0.0.1:6379

# Redis server details
REDIS_SERVER_IP=127.0.0.1
REDIS_SERVER_PORT=6379

# Redis session secret key for encryption
REDIS_SESSION_SECRET_KEY=P@ssword123w
```

### JWT Token Configuration

```env
# JWT token expiry time in minutes
COOKIE_JWT_TOKEN_EXPIRY=200
```

### Workspace & File Storage

```env
# Secure Magnus Workspace directory path
# This directory stores organization files, templates, QR codes, and phishing materials
SECURE_MAGNUS_WORKSPACE=c:\secure_magnus_workspace
```

### Security Keys

```env
# Backend suite public key path for JWT verification
BACKEND_SUITE_PUBLIC_KEY_PATH=C:\secure_magnus_workspace\keys\public.pem
```

### Logging Configuration

```env
# Logger directory path
LOGS_DIR=C:\SecureMagnus\application logs

# Log file name prefix
LOGS_FILENAME="frontend"
```

### Environment Variables Explained:

1. **NODE_ENV**: Controls application behavior (development/production mode). Affects logging, error handling, and performance optimizations.

2. **Backend Endpoints**:
   - `BACKEND_EP`: Main backend API for product suite operations
   - `BACKEND_TVBS_URL`: Specialized backend for phishing test vectors (NFC, QR, Email, SMS, etc.)

3. **Redis Configuration**: Required for session management. The application will not start if Redis connection fails.

4. **SECURE_MAGNUS_WORKSPACE**: Central storage location for:
   - Organization-specific files
   - Phishing templates
   - QR codes and posters
   - User import files
   - USB phishing executables

5. **JWT Token Expiry**: Defines how long user sessions remain valid (in minutes).

6. **Logging**: Winston logger writes application logs to the specified directory with daily rotation.

### Important Security Notes:

- Never commit the `.env` file to version control
- Use strong, unique values for `REDIS_SESSION_SECRET_KEY`
- Ensure the public key path (`BACKEND_SUITE_PUBLIC_KEY_PATH`) is accessible and properly secured
- Keep the workspace directory (`SECURE_MAGNUS_WORKSPACE`) with appropriate file permissions

---

## Pre-requisites

0. Setup Service Suite by following [backend Installation](../SecureMagnusLLC/service_suite/README.md)

1. Install NPM on your operating system regardless of Linux or Windows.

2. Install **Redis**. If you are using Windows then follow the following guideline [WSL and Redis Installation](../Wsl_Redis_Installation.md). If you are using Linux follow:
   ```bash
   sudo apt install redis-server -y
   ```

3. Clone the repo **frontend**

4. Install Visual Studio Code with the following plugins: ENV, HTML Boilerplate, HTML CSS, or any other which will help you in NodeJS or Express framework.

5. Install dependencies via terminal, run below command in the frontend folder e.g. frontend/

```bash
npm install
```

---

## Configuration Setup

Now you are good to run the frontend server but you have to configure several variables.

1. Create `.env` file inside frontend root folder

```bash
suite_webapp/.env
```

2. Following configuration is required:

- `NODE_ENV`: The environment name (e.g., Development, Production)
- `HOST`: The IP address or hostname where the frontend application server will run
- `PORT`: The port number for the frontend application server
- `BACKEND_EP`: The service suite IP address and port, using HTTP or HTTPS (e.g., http://127.0.0.1:3000)
- `BACKEND_TVBS_URL`: TVBS system backend URL
- `REDIS_URL`: Complete Redis connection URL
- `REDIS_SERVER_IP`: Redis server IP address or hostname
- `REDIS_SERVER_PORT`: Redis server port number
- `REDIS_SESSION_SECRET_KEY`: Secret key for Redis session (must be the same in both Backend & Frontend)
- `COOKIE_JWT_TOKEN_EXPIRY`: Cookie expiry & JWT Expiry in minutes
- `SECURE_MAGNUS_WORKSPACE`: The workspace directory path for the application
- `BACKEND_SUITE_PUBLIC_KEY_PATH`: Path to the backend public key for JWT verification
- `LOGS_DIR`: Directory path where log files will be stored
- `LOGS_FILENAME`: Name of the log file

**Example `.env` file:**

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

---

## License

ISC