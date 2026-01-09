const { logger } = require("../../../logger/logger");
const getApiClient = require('../../../utility/api-client');
const render_ejs_urls = require("../../../config/render_ejs_urls");
const frontend_api_urls = require("../../../config/frontend_api_urls");
const backend_api_urls = require("../../../config/backend_api_urls");




exports.retrieveUser = async (req, res, next) => {
  logger.info(`Controller - [Retrieve User]: Incoming request to retrieve user with ID ${JSON.stringify(req.params, null, 2)}`);
  try {
    const userId = req.params?.userId || null;

    if (!userId || isNaN(parseInt(userId, 10)) || parseInt(userId, 10) <= 0) {
      logger.warn(`Controller - [Retrieve User]: Invalid user ID passed: ${userId}`);
      req.flash("message", "Invalid User ID has passed. Please contact administrator.");
      req.flash("alertType", "error");
      return res.redirect(frontend_api_urls.PRODUCT_SUITE.User_Management.SUITE_USERS);
    }

    const apiClient = getApiClient(req);
    const userResponse = await apiClient.get(backend_api_urls.PRODUCT_SUITE.User_Management.RETRIEVE_USER_BY_ID(userId));
    logger.info(`Controller - [Retrieve User]: Response from API: ${JSON.stringify(userResponse.data, null, 2)}`);

    // Handle user not found or error from API
    if (!userResponse.data.success) {
      req.flash("message", userResponse.data.message || "User not found.");
      req.flash("alertType", "error");
      return res.redirect(frontend_api_urls.PRODUCT_SUITE.User_Management.SUITE_USERS);
    }

    // Prepare render data
    const renderData = {
      user: userResponse.data.object,
      enableSuiteManagementLeftMenu: true,
    };
    logger.info(`Controller - [Retrieve User]: Rendering edit user page for user ID ${JSON.stringify(renderData, null, 2)}`);
    res.render(render_ejs_urls.ProductSuiteManagement.User_Management.EDIT_USER, renderData);
  } catch (error) {
    logger.error(`Error Controller - [Retrieve User]: ${error}`);
    logger.error(`Error Controller - [Retrieve User]: ${error.stack}`);
    req.flash("message", error?.response?.data?.message || 'Error in retrieving user.');
    req.flash("alertType", "error");
    return res.redirect(frontend_api_urls.PRODUCT_SUITE.User_Management.SUITE_USERS);
  }
};
