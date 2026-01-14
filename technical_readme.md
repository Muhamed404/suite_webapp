# Suite WebApp - Technical Documentation

This document provides detailed technical information about the Suite WebApp frontend application architecture, structure, and implementation details.

## Table of Contents

- [Application Entry Point - server.js](#application-entry-point---serverjs)
  - [Core Responsibilities](#core-responsibilities)
  - [Startup Flow Diagram](#startup-flow-diagram)
  - [Key Features Implemented in server.js](#key-features-implemented-in-serverjs)
  - [Important Notes](#important-notes)
  - [Required Information to Start the Application](#required-information-to-start-the-application)
  - [Pre-Start Checklist](#pre-start-checklist)
  - [Startup Validation](#startup-validation)
  - [Common Startup Issues and Solutions](#common-startup-issues-and-solutions)
- [Folder Structure](#folder-structure)
  - [Key Directory Purposes](#key-directory-purposes)
  - [Module Routing Structure](#module-routing-structure)
  - [Important Files](#important-files)
- [Constants Files](#constants-files)
- [Dependencies](#dependencies)
  - [Production Dependencies](#production-dependencies)
  - [Development Dependencies](#development-dependencies)
  - [Dependency Categories by Functionality](#dependency-categories-by-functionality)
  - [Static Asset Directory Structure](#static-asset-directory-structure)

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
- **Windows**: Install Redis via WSL (Windows Subsystem for Linux) - see [WSL and Redis Installation](Wsl_Redis_Installation.md)
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

The Suite WebApp frontend follows a modular architecture with clear separation of concerns. Below is the detailed folder structure and the purpose of each directory.

```
suite_webapp/
├── awaremagnus/                    # AwareMagnus (LMS) module
│   ├── controllers/                # Business logic for awareness training features
│   ├── routes/                     # AwareMagnus-specific route definitions
│   └── views/                      # EJS templates for LMS pages
│
├── commons/                        # Shared utilities and helper functions
│   └── [utility functions]         # Common code used across modules
│
├── config/                         # Configuration files
│   └── env.config.js               # Environment variable loader (.env parser)
│
├── contants/                       # Application constants (note: typo in folder name)
│   ├── application-constants.js    # Workspace paths, backend URLs, TVB routes
│   ├── enum.js                     # Enumerations (user types, phishing types, etc.)
│   └── ICONSTANTS.js               # Interface/additional constants
│
├── locales/                        # Internationalization (i18n) files
│   └── [language].json             # Translation files for multi-language support
│
├── logger/                         # Winston logging configuration
│   └── logger.js                   # Logger setup with daily rotation
│
├── middleware/                     # Express middleware functions
│   ├── jwt_authenticator/          # JWT token validation logic
│   ├── menu/                       # Dynamic menu generation based on user roles
│   └── session_management/         # Session handling and cookie management
│
├── phishmagnus/                    # PhishMagnus (Phishing Simulation) module
│   ├── controllers/                # Phishing campaign business logic
│   ├── public/                     # PhishMagnus-specific static assets
│   ├── routes/                     # PhishMagnus route definitions
│   └── views/                      # EJS templates for phishing simulation pages
│
├── productsuite/                   # Product Suite (Core Platform) module
│   ├── controllers/                # Core platform business logic
│   ├── routes/                     # Product Suite route definitions
│   │   └── product_suite_routes.js # Main routing file
│   └── views/                      # EJS templates for core platform pages
│
├── public/                         # Static assets served to clients
│   ├── securemagnus_2025/          # Main application assets
│   │   ├── css/                    # Stylesheets
│   │   ├── js/                     # Client-side JavaScript
│   │   ├── images/                 # Images, logos, icons
│   │   └── favicon.ico             # Application favicon
│   └── robots.txt                  # Search engine crawler instructions
│
├── routes/                         # Main application routing
│   └── routes.js                   # Master router (mounts all module routes)
│
├── utility/                        # Utility functions and helpers
│   └── [helper scripts]            # Various utility functions
│
├── views/                          # Shared EJS templates
│   ├── error_pages/                # Error page templates (404, 500)
│   └── layout/                     # Master layout templates
│       └── layout_center.ejs       # Default layout with header, nav, footer
│
├── .env                            # Environment variables (NOT in version control)
├── .gitignore                      # Git ignore rules
├── package.json                    # Node.js dependencies and scripts
├── package-lock.json               # Locked dependency versions
├── server.js                       # Application entry point
└── Wsl_Redis_Installation.md       # Redis installation guide for Windows/WSL
```

---

### Key Directory Purposes

#### Module Directories

| Directory | Purpose | Key Files |
|-----------|---------|-----------|
| **awaremagnus/** | Awareness training and LMS functionality | Routes: `/awm/*` |
| **phishmagnus/** | Phishing simulation campaigns | Routes: `/phm/*` |
| **productsuite/** | Core platform (organization, users, subscriptions) | Routes: `/` (root) |

Each module follows the **MVC pattern** with:
- **controllers/**: Business logic and backend API communication
- **routes/**: Express route definitions
- **views/**: EJS templates for UI rendering

#### Core Directories

| Directory | Purpose | Contents |
|-----------|---------|----------|
| **config/** | Configuration management | Environment variable parsing |
| **contants/** | Application constants | Enums, workspace paths, API routes |
| **middleware/** | Express middleware | Authentication, session, logging, menu generation |
| **logger/** | Logging infrastructure | Winston logger with daily rotation |
| **commons/** | Shared utilities | Helper functions used across modules |
| **utility/** | Additional utilities | Miscellaneous helper scripts |

#### Frontend Asset Directories

| Directory | Purpose | Access URL |
|-----------|---------|------------|
| **public/securemagnus_2025/** | Main application static assets | `/securemagnus_2025/*` |
| **phishmagnus/public/** | PhishMagnus-specific assets | `/phishmagnus/*` |

#### View Directories

| Directory | Purpose | Templates |
|-----------|---------|-----------|
| **views/layout/** | Master page layouts | `layout_center.ejs` (default) |
| **views/error_pages/** | Error pages | `404.ejs`, `500.ejs` |
| **productsuite/views/** | Product Suite pages | Dashboard, organizations, users |
| **phishmagnus/views/** | PhishMagnus pages | Campaigns, templates, reports |
| **awaremagnus/views/** | AwareMagnus pages | Training modules, courses |

---

### Module Routing Structure

The [routes/routes.js](routes/routes.js) file acts as the **master router** that mounts all module routes:

```javascript
const express = require('express');
const router = express.Router();
const PhishMagnusRoutes = require('../phishmagnus/routes/phishmagnus-routes');
const ProductSuiteRoutes = require('../productsuite/routes/product_suite_routes');
const AwarenessMagnusRoutes = require('../awaremagnus/routes/awm_routes');

router.use("/phm", PhishMagnusRoutes);    // PhishMagnus: /phm/*
router.use("/", ProductSuiteRoutes);       // Product Suite: /* (root)
// router.use("/awm", AwarenessMagnusRoutes); // AwareMagnus: /awm/* (commented out)

module.exports = router;
```

**Route Prefixes:**
- **Product Suite**: `/` (root paths)
- **PhishMagnus**: `/phm/` prefix
- **AwareMagnus**: `/awm/` prefix (currently disabled)

---

### Important Files

| File | Purpose | Location |
|------|---------|----------|
| **server.js** | Application entry point and Express server setup | Root directory |
| **package.json** | Node.js dependencies and npm scripts | Root directory |
| **.env** | Environment variables (API URLs, keys, paths) | Root directory (not in Git) |
| **routes.js** | Master router mounting all module routes | [routes/routes.js](routes/routes.js) |
| **env.config.js** | Loads and validates environment variables | [config/env.config.js](config/env.config.js) |
| **logger.js** | Winston logger configuration | [logger/logger.js](logger/logger.js) |

---

## Constants Files

The application uses several constant files to maintain consistency and avoid hardcoding values throughout the codebase. These files are located in the [contants/](contants/) directory (note the typo in the directory name).

### 1. application-constants.js

**Location**: [contants/application-constants.js](contants/application-constants.js)

This file defines critical application-wide constants including workspace folder names, backend URLs, and test vector backend (TVB) routing configuration.

Note: will merge all constant file into this.


## Dependencies

The Suite WebApp frontend uses various npm packages for different functionalities. Below is a comprehensive breakdown of all dependencies defined in [package.json](package.json).

### Production Dependencies

#### Core Framework & Server

| Package | Version | Purpose |
|---------|---------|---------|
| **express** | ^4.19.2 | Core web server framework |
| **body-parser** | ^1.20.2 | Parse incoming request bodies (JSON, URL-encoded) |
| **cookie-parser** | ^1.4.6 | Parse cookies from HTTP requests |
| **cors** | ^2.8.5 | Enable Cross-Origin Resource Sharing |
| **dotenv** | ^16.4.4 | Load environment variables from .env file |
| **dotenv-flow** | ^4.1.0 | Environment-specific .env file management |

#### Templating & Views

| Package | Version | Purpose |
|---------|---------|---------|
| **ejs** | ^3.1.9 | Embedded JavaScript templates for server-side rendering |
| **express-ejs-layouts** | ^2.5.1 | Layout support for EJS templates |
| **he** | ^1.2.0 | HTML entity encoder/decoder for XSS prevention |

#### Authentication & Session Management

| Package | Version | Purpose |
|---------|---------|---------|
| **jsonwebtoken** | ^9.0.2 | JWT token creation and validation |
| **express-session** | ^1.18.0 | Session middleware for Express |
| **connect-redis** | ^8.1.0 | Redis session store for express-session |
| **ioredis** | ^5.6.1 | Redis client for session storage and caching |
| **connect-flash** | ^0.1.1 | Flash messages stored in session |
| **crypto** | ^1.0.1 | Cryptographic functions (encryption, hashing) |

#### HTTP & API Communication

| Package | Version | Purpose |
|---------|---------|---------|
| **axios** | ^1.6.7 | Promise-based HTTP client for backend API calls |
| **node-fetch** | ^2.7.0 | Fetch API implementation for Node.js |
| **form-data** | ^4.0.0 | Create multipart/form-data streams for file uploads |

#### File Handling & Processing

| Package | Version | Purpose |
|---------|---------|---------|
| **express-fileupload** | ^1.5.0 | File upload middleware for Express |
| **multer** | ^1.4.5-lts.1 | Alternative file upload middleware (multipart/form-data) |
| **archiver** | ^7.0.1 | Create ZIP archives for file downloads |
| **csv-parser** | ^3.0.0 | Parse CSV files (user imports) |
| **fs** | ^0.0.1-security | File system operations (native Node.js module wrapper) |
| **mime-types** | ^2.1.35 | MIME type detection for file uploads |

#### Image Processing

| Package | Version | Purpose |
|---------|---------|---------|
| **sharp** | ^0.33.5 | High-performance image processing (resize, crop, convert) |
| **jimp** | ^0.16.1 | JavaScript image manipulation (alternative to Sharp) |
| **qrcode** | ^1.5.4 | Generate QR codes for phishing campaigns |

#### PDF Generation & Manipulation

| Package | Version | Purpose |
|---------|---------|---------|
| **pdfkit** | ^0.15.0 | PDF document generation |
| **pdf-lib** | ^1.17.1 | Create and modify PDF documents |
| **html-pdf** | ^3.0.1 | Convert HTML to PDF |
| **puppeteer** | ^22.14.0 | Headless Chrome for HTML-to-PDF rendering |

#### Data Visualization & Charts

| Package | Version | Purpose |
|---------|---------|---------|
| **chart.js** | ^4.4.7 | JavaScript charting library for campaign reports |

#### Internationalization (i18n)

| Package | Version | Purpose |
|---------|---------|---------|
| **i18n** | ^0.15.1 | Multi-language support and translation management |

#### Validation & Security

| Package | Version | Purpose |
|---------|---------|---------|
| **express-validator** | ^7.0.1 | Input validation and sanitization for Express routes |
| **ajv** | ^8.12.0 | JSON Schema validator |

#### Logging

| Package | Version | Purpose |
|---------|---------|---------|
| **winston** | ^3.12.0 | Flexible logging library |
| **winston-daily-rotate-file** | ^5.0.0 | Log file rotation by date |

#### Utility & Formatting

| Package | Version | Purpose |
|---------|---------|---------|
| **moment** | ^2.30.1 | Date and time manipulation/formatting |

#### CSS Framework

| Package | Version | Purpose |
|---------|---------|---------|
| **tailwindcss** | ^4.1.11 | Utility-first CSS framework |
| **@tailwindcss/vite** | ^4.1.11 | Tailwind CSS integration with Vite |

#### Environment & Cross-Platform

| Package | Version | Purpose |
|---------|---------|---------|
| **cross-env** | ^10.1.0 | Set environment variables across platforms (Windows/Linux) |

---

### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| **nodemon** | ^3.0.3 | Auto-restart server on file changes (development mode) |
| **javascript-obfuscator** | ^4.1.1 | JavaScript code obfuscation for production builds |

---

### Dependency Categories by Functionality

#### 1. Authentication & Security Stack
- jsonwebtoken (JWT tokens)
- crypto (encryption)
- express-session (session management)
- connect-redis (session persistence)
- ioredis (Redis client)
- express-validator (input validation)

#### 2. File Processing Stack
- express-fileupload / multer (file uploads)
- sharp / jimp (image processing)
- qrcode (QR code generation)
- archiver (ZIP creation)
- csv-parser (CSV parsing)

#### 3. PDF Generation Stack
- pdfkit (programmatic PDF creation)
- pdf-lib (PDF manipulation)
- html-pdf (HTML to PDF conversion)
- puppeteer (headless browser rendering)

#### 4. API Communication Stack
- axios (HTTP client)
- node-fetch (Fetch API)
- form-data (multipart requests)

#### 5. Frontend & Templating Stack
- ejs (server-side templating)
- express-ejs-layouts (layouts)
- tailwindcss (CSS framework)
- chart.js (data visualization)

---

---

### Static Asset Directory Structure

```
public/
├── robots.txt                   # Search engine directives
└── securemagnus_2025/
    ├── css/
    │   ├── main.css             # Main application styles
    │   ├── tailwind.css         # Tailwind CSS framework
    │   ├── dashboard.css        # Dashboard-specific styles
    │   └── forms.css            # Form styles
    │
    ├── js/
    │   ├── jquery.min.js        # jQuery library
    │   ├── main.js              # Main application JavaScript
    │   ├── chart.min.js         # Chart.js for data visualization
    │   ├── validation.js        # Client-side form validation
    │   └── campaigns.js         # Campaign-specific functionality
    │
    ├── images/
    │   ├── logo.png             # Application logo
    │   ├── icons/               # UI icons
    │   └── backgrounds/         # Background images
    │
    └── favicon.ico              # Browser favicon

phishmagnus/public/
├── css/
│   └── phishmagnus.css          # PhishMagnus-specific styles
└── js/
    └── campaign-wizard.js       # Campaign creation wizard
```

---