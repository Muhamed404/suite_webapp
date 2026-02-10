const { logger } = require("../../../logger/logger");
const envConfig = require("../../../config/env.config");

/**
 * Redirects authenticated user to the Aware Magnus dashboard URL with the JWT
 * in the URL hash (fragment). The hash is not sent to the server on request,
 * so the token is not logged or exposed in referrer.
 */
exports.redirectToAwareMagnus = (req, res) => {
  const baseUrl = envConfig.AWAREMAGNUS_DASHBOARD_URL;
  if (!baseUrl) {
    logger.warn("[Redirect AWM]: AWAREMAGNUS_DASHBOARD_URL is not set in .env");
    return res.status(503).send("Aware Magnus dashboard URL is not configured.");
  }

  const token = req.session?.jwtToken;
  if (!token) {
    logger.warn("[Redirect AWM]: No session token; user may not be logged in");
    return res.redirect("/login");
  }

  const dashboardPath = "/dashboard";
  const targetUrl = `${baseUrl}${dashboardPath}#token=${encodeURIComponent(token)}`;
  logger.info("[Redirect AWM]: Redirecting to Aware Magnus dashboard");
  return res.redirect(302, targetUrl);
};
