const { logger } = require("../../../logger/logger");
const { redactLogData, redactString } = require("../../../utility/redact");
const enums = require('../../../contants/enum')
const getApiClient = require('../../../utility/api-client');
const frontend_api_urls = require("../../../config/frontend_api_urls");
const backend_api_urls = require("../../../config/backend_api_urls");




exports.deleteUser = async (req, res, next) => {
  logger.info(`Controller - Delete User: Incoming request to delete user with ID ${redactLogData(req.params.userId)}`);
  try {
    const userIdToDelete = parseInt(req.params.userId, 10);
    if (isNaN(userIdToDelete) || userIdToDelete <= 0) {
      logger.warn(`Controller - Delete User: Invalid user ID passed: ${redactLogData(req.params.userId)}`);
      req.flash("message", "Invalid User ID has passed. Please contact administrator.");
      req.flash("alertType", "error");
      return res.redirect(frontend_api_urls.PRODUCT_SUITE.User_Management.SUITE_USERS);
    }

    const deleteUrl = backend_api_urls.PRODUCT_SUITE.User_Management.DELETE(userIdToDelete);
    const apiClient = getApiClient(req);
    const response = await apiClient.delete(deleteUrl);
      logger.info(`Controller - Delete User: Response from API: ${JSON.stringify(redactLogData(response.data), null, 2)}`);
    if (response.data.success) {
      logger.info(`Controller - Delete User: User deleted successfully`);
      req.flash("alertType", "success");
      req.flash("message", response.data.message || 'User deleted successfully');
    } else {
      logger.error(`Controller - Delete User: Failed to delete user. Message: ${redactString(response.data.message || "")}`);
      req.flash("alertType", "error");
      req.flash("message", response.data.message || 'Failed to delete user');
    }

    if(req.user.organization_id === null){
      return res.redirect(frontend_api_urls.PRODUCT_SUITE.User_Management.SECUREMAGNUS_USERS_LIST);
    }
    return res.redirect(frontend_api_urls.PRODUCT_SUITE.User_Management.SUITE_USERS);

  } catch (error) {
    logger.error(`Error - Controller - Delete User: ${redactString(error.message || String(error))}`);
    logger.error(redactString(error.stack || ""))
    req.flash("message",  "Issue in deleting PhishMagnus user. Please try again later.");
    req.flash("alertType", "error");
    return res.redirect(frontend_api_urls.PRODUCT_SUITE.User_Management.SUITE_USERS);

  }
};