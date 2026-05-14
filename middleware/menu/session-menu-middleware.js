const { logger } = require("../../logger/logger");
const { generateMenu } = require('./suite_and_product_menu_middleware');
const { redactEmail, redactSessionId } = require("../../phishmagnus/utility/redact");



function generateMenuMiddleware(req, res, next) {
  // Skip static asset requests
  if (/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|map)$/i.test(req.path)) {
    return next();
  }

  const { url, method, path } = req;
  const user = req.user;
  res.locals.currentPath = path; // For active route styling

  if (user) {
    logger.info(`[SESSION-MIDDLEWARE] SESSION ID: ${redactSessionId(req.sessionID)}`);

    logger.info(`Middleware - Generating menu for user ${redactEmail(user.email)} in organization ${user.organization_id}`);
    const orgId = user.organization_id;

    if (req.path.startsWith('/phm') || (req.path.startsWith('/awm') || req.path.startsWith('/')) && (user.phm_license || user.awm_license)) {
      res.locals.menu = generateMenu(req, orgId);
    } 
    // else if (req.path.startsWith('/awm') && session?.jwtToken.user.awm_license) {
    //   // console.log('Generating Aware Magnus Menu');
    //   // res.locals.menu = generateMenu(req, orgId);
    // } else if (req.path.startsWith('/')) {
    //   res.locals.menu = generateMenu(req, orgId);
    // } 
    else {
      res.locals.menu = [];
    }

    return next();
  } else {
    res.locals.locals_awm_subscription = false;
    res.locals.locals_phm_subscription = false;
    res.locals.menu = [];

    // Allow MFA pending users through — they are mid-authentication
    if (req.session && req.session.mfaPendingUser) {
      logger.info(`[SESSION-MIDDLEWARE] mfaPendingUser found, allowing MFA flow for: ${redactLogData(url)}`);
      return next();
    }

    // Allow unauthenticated access to login and MFA routes
    const publicRoutes = ["/login", "/mfa"];
    const isAllowed = publicRoutes.some(route => url === route || url.startsWith(`${route}/`));

    if (method === "POST" && url === "/login") {
      logger.info(`[SESSION-MIDDLEWARE] Login POST submitted`);
      return next();
    }

    if (isAllowed) {
      logger.info(`[SESSION-MIDDLEWARE] Public access route: ${redactLogData(url)}`);
      return next();
    }

    logger.warn(`[SESSION-MIDDLEWARE] Session not found. Redirecting to login...`);
    return res.redirect('/login'); // <-- explicit redirect
  }
}


module.exports = generateMenuMiddleware;
