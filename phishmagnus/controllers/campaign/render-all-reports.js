const { logger } = require("../../../logger/logger");
const enums = require("../../../contants/enum");
const frontend_api_urls = require("../../../config/frontend_api_urls");
const render_ejs_urls = require("../../../config/render_ejs_urls");

exports.renderAllReports = async (req, res) => {
  const logCtx = "[All Reports]";

  try {
    if (!req.session || !req.user) {
      logger.warn(`${logCtx} No active session - redirecting to login`);
      req.flash("message", "Please log in to continue.");
      req.flash("alertType", "error");
      return res.redirect(frontend_api_urls.LOGIN.PHISHMAGNUS);
    }

    return res.render(render_ejs_urls.PhishMagnus.Campaign.Reports.ALL_REPORTS, {
      message: res.locals.message || [],
      alertType: res.locals.alertType || [],
      user: req.user,
      magnusAdmin: typeof res.locals.magnusAdmin !== "undefined" ? res.locals.magnusAdmin : (req.user?.organization_id === null)
    });
  } catch (error) {
    logger.error(`${logCtx} Error rendering reports page: ${error.message}`);
    logger.error(error.stack);

    req.flash("message", "Unable to load reports. Please try again.");
    req.flash("alertType", "error");
    return res.redirect("/phm/?message=reports-unavailable&alertType=error");
  }
};

