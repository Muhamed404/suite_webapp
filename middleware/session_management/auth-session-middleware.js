// auth-session-middleware.js
const session = require('express-session');
const jwt = require('jsonwebtoken');
const Redis = require('ioredis');
const RedisStore = require('connect-redis').RedisStore; // <-- Use .RedisStore
const cookieParser = require('cookie-parser');
const envConfig = require('../../config/env.config');
const ApplicationConstants = require('../../contants/application-constants');
const { logger } = require('../../logger/logger');

// Config
const config = {
    REDIS_URL: envConfig.REDIS_URL,
    REDIS_SESSION_SECRET_KEY: envConfig.REDIS_SESSION_SECRET_KEY,
    COOKIE_EXPIRY_MS: ApplicationConstants.COOKIE_JWT_TOKEN_EXPIRY * 60 * 1000,
};

// ioredis client
const redisClient = new Redis(config.REDIS_URL);

redisClient.on('connect', () => logger.info('Connected to Redis'));
redisClient.on('error', (err) => {
    logger.error('Redis error:' + err.message);
    // Optionally, set a flag or notify admins
});

// Session middleware
const storeSessionMiddleware = session({
    store: new RedisStore({ client: redisClient, prefix: 'phishmagnus_sess:' }),
    secret: config.REDIS_SESSION_SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    rolling: true, // <-- This resets cookie expiration on every response
    cookie: {
        maxAge: config.COOKIE_EXPIRY_MS,
        httpOnly: true,
        secure: false, // true in production with HTTPS
        sameSite: 'strict',
    },
});

// Cookie parser middleware
const cookieParserMiddleware = cookieParser(config.REDIS_SESSION_SECRET_KEY);

// Middleware to validate session
async function validateSessionMiddleware(req, res, next) {
    try {
        if (!req.session) {
            logger.error('Middleware - No session object found (Redis or cookie issue)');
            req.flash('message', 'Session not initialized. Please log in again.');
            req.flash('alertType', 'error');
            return res.redirect('/login');
        }

        // Log current Redis session ID
        logger.info(`Middleware - Session ID: ${req.sessionID}`);

        // Log session data
        // logger.info(`Middleware - Session Data: ${JSON.stringify(req.session, null, 2)}`);

        // Check if JWT is stored in session
        const userjwtToken = req.session.jwtToken;
        if (!userjwtToken) {
            // Allow through if MFA is pending — user is mid-authentication
            if (req.session.mfaPendingUser) {
                logger.info('Middleware - No jwtToken but mfaPendingUser found, allowing MFA flow');
                return next();
            }
            logger.warn('Middleware - No JWT token found in Redis session');
            req.flash('message', 'Your session has expired. Please log in again.');
            req.flash('alertType', 'error');
            return res.redirect('/login');
        }

        // Decode JWT (no verify yet)
        const decoded = jwt.decode(userjwtToken);
        if (!decoded) {
            logger.warn('Middleware - Invalid JWT in session');
            req.flash('message', 'Invalid session. Please log in again.');
            req.flash('alertType', 'error');
            return res.redirect('/login');
        }

        // logger.info(`Middleware - Decoded JWT: ${JSON.stringify(decoded, null, 2)}`);
        req.user = decoded.user;

        // Continue
        next();
    } catch (err) {
        logger.error(`Middleware - Session validation failed: ${err.message}`);
        logger.error(err.stack);
        req.flash('message', 'Session validation error. Please log in again.');
        req.flash('alertType', 'error');
        return res.redirect('/login');
    }
}

module.exports = {
    redisClient,
    storeSessionMiddleware,
    cookieParserMiddleware,
    validateSessionMiddleware,
    config,
};
