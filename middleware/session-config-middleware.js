const config = require("../config/env.config");
const session = require('express-session');
const { RedisStore } = require('connect-redis');
const Redis = require('ioredis');
const jwt = require('jsonwebtoken');
const ApplicationConstants = require("../contants/application-constants");
const { redactLogData, redactSessionId, redactString } = require("../utility/redact");

// Initialize Redis client
const redisClient = new Redis({
  host: config.REDIS_SERVER_IP,
  port: config.REDIS_SERVER_PORT
});

redisClient.on('error', function (err) {
  logger.info('Could not establish a connection with redis. ' + err);
});

redisClient.on('connect', function () {
  logger.info('Connected to redis successfully!');
});

// In redis v4, the way to create a RedisStore has changed.
// cookie meta will be store in the redis and the key will be session id.
// user information
// jwt token
// role id only
// permissions
// subscriptions locals_awm_subscription , locals_phm_subscription
// 
const storeUserSessionInRedis = session({
  store: new RedisStore({ client: redisClient }), // Now this should work correctly
  secret: config.REDIS_SESSION_SECRET_KEY, // A string used to sign the session ID cookie
  resave: false, // Prevents resaving a session to Redis if it hasn’t been modified.
  saveUninitialized: false, // Prevents storing empty sessions
  cookie: {
    maxAge: ApplicationConstants.COOKIE_JWT_TOKEN_EXPIRY * 60 * 1000, // converting into minutes maxAge = 30 * 60 * 1000 = 1,800,000 ms = 30 minutes
    httpOnly: true,      // prevents client-side JS from accessing the cookie
    secure: false,        // cookie sent only over HTTPS (set false in dev). In development on HTTP (localhost), set secure: false so cookies work. In production with HTTPS, set secure: true to ensure cookie security.
    sameSite: 'strict',  // protects against CSRF
  },
});

const sessionTimeoutValidation = (req, res, next) => {
  logger.info(`[Session Config Middleware]: Validating session timeout for sessionID=${redactSessionId(req.sessionID)}`);

  const currentTimestamp = Math.floor(Date.now() / 1000);

  // Check JWT token expiry
  const token = req?.session?.jwtToken || null;
  if (token !== null && token) {
    try {
      const decoded = jwt.decode(token);
      logger.info('[Session Config Middleware]: Decoded JWT ' + JSON.stringify(redactLogData(decoded), null, 2));

      const { iss: service_id, sub: service_name, iat: issuedAt, exp: expiresAt } = decoded;
      if (expiresAt && currentTimestamp >= expiresAt) {
        logger.warn(`${logTxn} - Token expired for service_id=${service_id}, service_name=${service_name}`);
        throw new Error('Token has expired');
      }

    } catch (err) {
      logger.error("[Session Config Middleware]: Failed to decode JWT token:" + redactString(err.message));
      req.flash('message', 'Session expired. Please log in again.');
      req.flash('alertType', 'error');
      req.session.destroy(() => { });
      return res.redirect("/login");
    }
  } else {
    req.flash('message', 'Invalid session. Please log in again.');
    req.flash('alertType', 'error');
    req.session.destroy(() => { });
    return res.redirect("/login");
  }
  next();
};



// Export the middleware function
module.exports = {

  storeUserSessionInRedis,
  sessionTimeoutValidation,
};

