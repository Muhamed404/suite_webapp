const { logger } = require("../../../logger/logger");
const ICONSTANTS = require("../../../contants/ICONSTANTS");
const enums = require('../../../contants/enum')
const getApiClient = require('../../../utility/api-client');
const render_ejs_urls = require("../../../config/render_ejs_urls");
const frontend_api_urls = require("../../../config/frontend_api_urls");
const backend_api_urls = require("../../../config/backend_api_urls");




exports.editUser = async (req, res, next) => {
  logger.info(`Controller - [Edit User]: Incoming request to edit user with ID ${JSON.stringify(req.params, null, 2)}`);
  try {
    const userId = req.params?.userId || null;

    if (!userId || isNaN(parseInt(userId, 10)) || parseInt(userId, 10) <= 0) {
      logger.warn(`Controller - [Edit User]: Invalid user ID passed: ${userId}`);
      req.flash("message", "Invalid User ID has passed. Please contact administrator.");
      req.flash("alertType", "error");
      return res.redirect(frontend_api_urls.PRODUCT_SUITE.User_Management.SUITE_USERS);
    }

    const payload = req.body || {};
    logger.info(`Controller - [Edit User]: Payload received for editing user ID ${userId}: ${JSON.stringify(payload, null, 2)}`);

    // Payload validation
    if (
      !payload.firstName ||
      !payload.lastName ||
      !payload.email ||
      typeof payload.status === 'undefined'
    ) {
      logger.warn(`Controller - [Edit User]: Invalid payload received: ${JSON.stringify(payload)}`);
      req.flash("message", "Invalid or incomplete data submitted. Please fill all required fields.");
      req.flash("alertType", "error");
      return res.redirect(frontend_api_urls.PRODUCT_SUITE.User_Management.EDIT_USER(userId));
    }

    const apiClient = getApiClient(req);
    const userResponse = await apiClient.put(backend_api_urls.PRODUCT_SUITE.User_Management.SAVE_EDIT_USER(userId), payload);
    logger.info(`Controller - [Edit User]: Response from API: ${JSON.stringify(userResponse.data, null, 2)}`);

    // Handle user not found or error from API
    if (!userResponse.data.success) {
      req.flash("message", userResponse.data.message || "Error in saving user.");
      req.flash("alertType", "error");
      return res.redirect(frontend_api_urls.PRODUCT_SUITE.User_Management.EDIT_USER(userId));
    }

    req.flash("message", userResponse.data.message || "Error in saving user.");
    req.flash("alertType", "success");
    if (req.user.organization_id === null) {
      return res.redirect(frontend_api_urls.PRODUCT_SUITE.User_Management.SECUREMAGNUS_USERS_LIST);

    }
    return res.redirect(frontend_api_urls.PRODUCT_SUITE.User_Management.SUITE_USERS);
  } catch (error) {
    logger.error(`Error Controller - [Edit User]: ${error}`);
    logger.error(`Error Controller - [Edit User]: ${error.stack}`);
    req.flash("message", error?.response?.data?.message || 'Error in saving user.');
    req.flash("alertType", "error");
    return res.redirect(frontend_api_urls.PRODUCT_SUITE.User_Management.SUITE_USERS);
  }
};
