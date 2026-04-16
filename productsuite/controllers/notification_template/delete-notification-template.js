const backend_api_urls = require("../../../config/backend_api_urls");
const frontend_api_urls = require("../../../config/frontend_api_urls");
const { logger } = require("../../../logger/logger");
const getApiClient = require("../../../utility/api-client");

const logTxn = "Controller - [Notification Template - Delete]";

exports.deleteTemplate = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  logger.info(`${logTxn} - Received delete request for template ID: ${id}, name: ${name}`);

  try {
    if (!id || !name) {
      req.flash("alertType", "error");
      req.flash("message", "Invalid template ID or name");
      return res.redirect(frontend_api_urls.PRODUCT_SUITE.Notification_Template.LIST);
    }

    const apiClient = getApiClient(req);
    const response = await apiClient.delete(
      backend_api_urls.PRODUCT_SUITE.Notification_Template.DELETE(id, name)
    );

    if (!response?.data?.success) {
      logger.warn(`${logTxn} - Deletion failed for template ID: ${id}`);
      req.flash("alertType", "error");
      req.flash("message", response?.data?.message || "Failed to delete template");
      return res.redirect(frontend_api_urls.PRODUCT_SUITE.Notification_Template.LIST);
    }

    logger.info(`${logTxn} - Template ${id} deleted successfully`);
    req.flash("alertType", "success");
    req.flash("message", req.__("settings.notificationTemplate.delete.success"));
    return res.redirect(frontend_api_urls.PRODUCT_SUITE.Notification_Template.LIST);
  } catch (error) {
    logger.error(`${logTxn} - ${error.message}`);
    logger.error(`${logTxn} - ${error.stack}`);
    req.flash("alertType", "error");
    req.flash("message", error.response?.data?.message || req.__("settings.notificationTemplate.delete.error"));
    return res.redirect(frontend_api_urls.PRODUCT_SUITE.Notification_Template.LIST);
  }
};
