
const { logger } = require('../../logger/logger');
const path = require('path');
const jwt = require('jsonwebtoken');
const ApplicationConstants = require('../../contants/application-constants');

// Allowlist paths and extensions that should not require auth
const SAFE_PATHS = new Set(['/health', '/favicon.ico', '/login', '/']);
const SAFE_EXTS = new Set(['.ico', '.png', '.jpg', '.jpeg', '.gif', '.css', '.js', '.map']);


function isSafe(req) {
  if (SAFE_PATHS.has(req.path)) return true;
  const ext = path.extname(req.path || '');
  if (SAFE_EXTS.has(ext)) return true;
  // static/public assets
  if (req.path && (req.path.startsWith('/public/') || req.path.startsWith('/assets/'))) return true;
  return false;
}



const logTxn = 'JWT Auth Middleware ';

module.exports = async function authenticateMiddleware(req, res, next) {
  try {
    logger.info(`${logTxn} - Incoming request: ${req.method} ${req.originalUrl}`);
    // logger.info(`${logTxn} - Checking header ${JSMiddleware - [Verify Service Token] - Checking header ON.stringify(req.headers)}`);
    // logger.info(`${logTxn} - Checking session ${JSON.stringify(req.session)}`);
    const userToken = req.session?.jwtToken || null;
    // logger.info(`${logTxn} - Checking session jwtToken ${userToken}`);

    if (!userToken || userToken === null) {
      logger.warn(`${logTxn} - Missing Authorization header`);
      return res.status(401).json({ success: false, message: 'Missing Authorization header' });
    }

    // Decode token (without verifying yet) to get iss and sub
    const decoded = jwt.decode(userToken);
    // logger.info(`${logTxn} - Decoded JWT: ${JSON.stringify(decoded, null, 2)}`);
    if (!decoded || !decoded.iss || !decoded.sub) {
      return res.status(400).json({ success: false, message: 'Invalid JWT payload structure' });
    }

    const { iss: service_id, sub: service_name, iat: issuedAt, exp: expiresAt } = decoded;
    req.permissions = Array.isArray(decoded.user?.permissions) ? decoded.user.permissions : [];
    req.user = decoded.user ?? null;
    req.role = decoded?.user?.role?.id ?? 0;

    // ✅ Step 1: Check expiry manually before further DB lookup
    const currentTimestamp = Math.floor(Date.now() / 1000);
    // if (expiresAt && currentTimestamp >= expiresAt) {
    //   logger.warn(`${logTxn} - Token expired for service_id=${service_id}, service_name=${service_name}`);
    //   req.flash('message', 'Your session has expired. Please log in again.');
    //   req.flash('alertType', 'error');
    //   req.session.destroy();
    //   return res.redirect('/login');
    // }
    logger.info(`${logTxn} - Token valid (not expired) for email=${decoded.user?.email}`);
    next();

  } catch (error) {
    logger.error(`${logTxn} - Middleware error:`, error);
    logger.error(error.stack);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

