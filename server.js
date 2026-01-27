const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const expressLayouts = require('express-ejs-layouts');
const i18n = require('./middleware/i18n-middleware');
const { logger } = require('./logger/logger');
const routes = require('./routes/routes');
const requestLogger = require('./middleware/request-logger-middleware');
const localeMiddleware = require('./middleware/locale-middleware');
const flash = require('connect-flash');
const config = require('./config/env.config');
const FrontendApplicationAPI = require('./config/frontend_api_urls');
const Redis = require('ioredis');
const startServer = require('./middleware/server-starter-middleware');

const {
  storeSessionMiddleware,
  cookieParserMiddleware,
  validateSessionMiddleware
} = require('./middleware/session_management/auth-session-middleware');
const setGlobalUserVariables = require('./middleware/variables-globally-middleware');
const generateMenuMiddleware = require('./middleware/menu/session-menu-middleware');



global.logger = logger;

const app = express();

// Health check endpoint (before other routes)
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Frontend service is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

/**
 * Views
 */
app.set('view engine', 'ejs');
app.set('views', [
  path.join(__dirname, 'views'),
  path.join(__dirname, 'productsuite', 'views'),
  path.join(__dirname, 'phishmagnus', 'views'),
]);

/**
 * Static assets
 */
app.use('/securemagnus_2025', express.static(path.join(__dirname, 'public', 'securemagnus_2025')));
app.use('/phishmagnus', express.static(path.join(__dirname, 'phishmagnus', 'public')));
app.get('/favicon.ico', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'securemagnus_2025', 'favicon.ico'));
});

/**
 * Body parser
 */
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

/**
 * Cookie parser and session middleware
 */
app.use(cookieParserMiddleware);
app.use(storeSessionMiddleware);

/**
 * Flash messages
 */
app.use(flash());
app.use((req, res, next) => {
  res.locals.message = req.flash('message');
  res.locals.alertType = req.flash('alertType');
  next();
});

/**
 * Request logger
 */
app.use(requestLogger);

/**
 * i18n and locale
 */
app.use(i18n.init);
app.use(localeMiddleware);
app.use((req, res, next) => {
  res.locals.locale = req.getLocale();
  next();
});
/**
 * Conditional session validation for protected routes
 */
app.use((req, res, next) => {
  const skipPaths = [
    FrontendApplicationAPI.LOGIN.PRODUCT_SUITE,
    FrontendApplicationAPI.LOGIN.PRODUCT_SUITE_DEFAULT,
    FrontendApplicationAPI.LOGIN.PHISHMAGNUS,
    FrontendApplicationAPI.LOGIN.AWAREMAGNUS,
    FrontendApplicationAPI.LOGOUT.SIGNOUT
  ];

  // Check path without query parameters
  const pathWithoutQuery = req.path;
  if (skipPaths.includes(pathWithoutQuery)) return next();

  // Validate session for all other paths

  validateSessionMiddleware(req, res, () => {
    generateMenuMiddleware(req, res, () => {
      setGlobalUserVariables(req, res, next);
    });
    // return validateSessionMiddleware(req, res, next);
  });
});
/**
 * Layouts
 */
app.use(expressLayouts);
app.set('layout', 'layout/layout_center');
app.post('/change-language', (req, res) => {
  console.log('Language change requested:', req.body.lang);
  const lang = req.body.lang;
  res.cookie('lang', lang, { maxAge: 900000, httpOnly: true });
  res.redirect(req.get('Referrer') || '/');
});
/**
 * Routes
 */
app.use('/', routes);

/**
 * 404 handler
 */
app.use((req, res) => {
  res.status(404).render('error_pages/404', {
    message: ['Page Not Found'],
    alertType: ['error']
  });
});

/**
 * Global error handler
 */
app.use((err, req, res, next) => {
  if (!err) return next();
  logger.error(err.stack || err.message || err);
  if (err.message && err.message.includes('Redis')) {
    return res.status(500).render('pages/login', { alertType: 'error', message: 'Session service unavailable. Please try again later.' });
  }
  if (req.accepts('html')) {
    return res.status(500).render('error_pages/500', { message: 'Internal Server Error' });
  }
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

/**
 * Redis connection
 */
const redisClient = new Redis(config.REDIS_URL, {
  maxRetriesPerRequest: 2, // Set to a lower number or 0 to disable retries
  reconnectOnError: (err) => {
    // Optionally, custom logic to reconnect
    console.error('Redis connection error:', err);
    return false; // Do not reconnect on error
  }
});

redisClient.ping()
  .then((result) => {
    if (result === 'PONG') {
      logger.info('✅ Redis connection successful.');
      console.log('Connected to Redis successfully.');
      // Start Express server
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

module.exports = app;
