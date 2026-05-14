const backend_api_urls = require("../../../config/backend_api_urls");
const { logger } = require("../../../logger/logger");
const { redactLogData, redactString } = require("../../../utility/redact");
const frontend_api_urls = require("../../../config/frontend_api_urls");
const getApiClient = require("../../../utility/api-client");
const enums = require('../../../contants/enum')



exports.retrieveUnEnrolledPHMUsers = async (req, res) => {
  logger.info(`Controller - UnEnrolled User List: Incoming request.`);
  try {
    const organization = parseInt(req.user.organization_id, 10);
    let url = backend_api_urls.PRODUCT_SUITE.User_Management.UNENROLLED_PHM_USERS;



    let productId = req.query?.productId || null; // <-- Get productId from query string
    if (productId === 'null' || productId === 'undefined' || productId === '') {
      productId = null;
      req.flash("message", "No product selected. Fetching enrolled users for all products.");
      req.flash('alertType', 'error');
      return res.redirect(frontend_api_urls.PRODUCT_SUITE.User_Management.SUITE_USERS);
    }
    if (productId === 'awm') {
      productId = Number(enums.Product_Selection.AwareMagnus);
    } else if (productId === 'phm') {
      productId = Number(enums.Product_Selection.PhishMagnus);
    } else if (productId === 'grc') {
      productId = Number(enums.Product_Selection.GRCMagnus);
    } else {
      req.flash("message", "Invalid product selected.");
      req.flash('alertType', 'error');
      return res.redirect(frontend_api_urls.PRODUCT_SUITE.User_Management.SUITE_USERS);
    }
    // If your backend API supports productId as a query param, append it:
    if (productId) {
      url += (url.includes('?') ? '&' : '?') + `productId=${encodeURIComponent(productId)}`;
    }
    const apiClient = getApiClient(req);
    logger.info(`Controller - UnEnrolled User List: Fetching UnEnrolled users from URL: ${redactString(url)}`);
    const response = await apiClient.get(url)

    const users = response.data?.users || [];
    if (users.length === 0) {
      logger.info('Controller - UnEnrolled User List: No UnEnrolled users found for organization ' + redactLogData(organization));
      return res.status(200).json({ success: true, unenrolledUsers: [] });
    }
    logger.info('Printing UnEnrolled users for organization ' + redactLogData(organization) + ': ' + JSON.stringify(redactLogData(users), null, 2));
    return res.status(200).json({ success: true, unenrolledUsers: users });

  } catch (error) {
    logger.error("Error - Controller - UnEnrolled User List: " + redactString(error.stack || ""));
    req.flash("message", "Error in fetching UnEnrolled users");
    req.flash('alertType', 'error');
    res.status(500).json({ success: false, message: "Error fetching users" });
  }
};