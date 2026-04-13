const backend_api_urls = require("../../../config/backend_api_urls");
const frontend_api_urls = require("../../../config/frontend_api_urls");
const render_ejs_urls = require("../../../config/render_ejs_urls");
const { logger } = require("../../../logger/logger");
const getApiClient = require("../../../utility/api-client");


exports.renderEditForm = async (req, res) => {
  const { id } = req.params;
  logger.info(`Controller - [Notification Template - Edit] - Rendering edit form for template ID: ${id}`);

  try {
    if (!id) {
      req.flash("alertType", "error");
      req.flash("message", "Invalid template ID");
      return res.redirect(frontend_api_urls.PRODUCT_SUITE.Notification_Template.LIST);
    }

    const apiClient = getApiClient(req);
    const response = await apiClient.get(backend_api_urls.PRODUCT_SUITE.Notification_Template.GET_BY_ID(id));

    if (!response?.data?.success) {
      req.flash("alertType", "error");
      req.flash("message", response?.data?.message || "Template not found");
      return res.redirect(frontend_api_urls.PRODUCT_SUITE.Notification_Template.LIST);
    }

    return res.render(render_ejs_urls.ProductSuiteManagement.Notification_Template.EDIT, {
      enableSuiteManagementLeftMenu: true,
      template: response.data.data,
    });
  } catch (error) {
    logger.error(`Controller - [Notification Template - Edit] - ${error.message}`);
    logger.error(`Controller - [Notification Template - Edit] - ${error.stack}`);
    req.flash("alertType", "error");
    req.flash("message", error.response?.data?.message || "Failed to load template");
    return res.redirect(frontend_api_urls.PRODUCT_SUITE.Notification_Template.LIST);
  }
};

exports.submitEditForm = async (req, res) => {
  const { id } = req.params;
  logger.info(`Controller - [Notification Template - Edit] - Received update request for template ID: ${id}`);
  logger.info(`Controller - [Notification Template - Edit] - Body: ${JSON.stringify(req.body.name, null, 2)}`);

  try {
    if (!id) {
      req.flash("alertType", "error");
      req.flash("message", "Invalid template ID");
      return res.redirect(frontend_api_urls.PRODUCT_SUITE.Notification_Template.LIST);
    }

    const { notification_type, language, name, subject, body, is_active, is_system } = req.body;

    const payload = {
      notification_type,
      language,
      name,
      subject: subject || null,
      body,
      is_active: is_active === "true" || is_active === true,
      is_system: is_system === "true" || is_system === true,
    };

    logger.info(`Controller - [Notification Template - Edit] - Payload: ${JSON.stringify(payload.name, null, 2)}`);

    const apiClient = getApiClient(req);
    const response = await apiClient.put(
      backend_api_urls.PRODUCT_SUITE.Notification_Template.UPDATE(id),
      payload
    );

    if (!response?.data?.success) {
      req.flash("alertType", "error");
      req.flash("message", response?.data?.message || "Failed to update template");
      return res.redirect(frontend_api_urls.PRODUCT_SUITE.Notification_Template.EDIT(id));
    }

    logger.info(`Controller - [Notification Template - Edit] - Template ${id} updated successfully`);
    req.flash("alertType", "success");
    req.flash("message", req.__("settings.notificationTemplate.edit.success"));
    return res.redirect(frontend_api_urls.PRODUCT_SUITE.Notification_Template.LIST);
  } catch (error) {
    logger.error(`Controller - [Notification Template - Edit] - ${error.message}`);
    logger.error(`Controller - [Notification Template - Edit] - ${error.stack}`);
    req.flash("alertType", "error");
    req.flash("message", error.response?.data?.message || req.__("settings.notificationTemplate.edit.error"));
    return res.redirect(frontend_api_urls.PRODUCT_SUITE.Notification_Template.EDIT(id));
  }
};
