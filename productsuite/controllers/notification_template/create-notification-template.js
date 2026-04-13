const backend_api_urls = require("../../../config/backend_api_urls");
const frontend_api_urls = require("../../../config/frontend_api_urls");
const render_ejs_urls = require("../../../config/render_ejs_urls");
const { logger } = require("../../../logger/logger");
const getApiClient = require("../../../utility/api-client");
const { NotificationTypes } = require("../../../contants/application-constants");

 

exports.renderForm = (req, res) => {
  logger.info(`Controller - [Notification Template - Create] - Rendering create form`);
  return res.render(render_ejs_urls.ProductSuiteManagement.Notification_Template.CREATE, {
    enableSuiteManagementLeftMenu: true,
    notificationTypes: NotificationTypes,
  });
};

exports.submitForm = async (req, res) => {
  logger.info(`Controller - [Notification Template - Create] - Received create request`);
  logger.info(`Controller - [Notification Template - Create] - Body: ${JSON.stringify(req.body.name_en, null, 2)}`);
  logger.info(`Controller - [Notification Template - Create] - Body: ${JSON.stringify(req.body.name_ar, null, 2)}`);


  try {
    const organizationId = req.user.organization_id !== null
      ? Number(req.user.organization_id)
      : 0;

    const {
      notification_type,
      is_active,
      is_system,
      name,
      // EN fields
      subject_en,
      body_en,
      // AR fields
      subject_ar,
      body_ar,
    } = req.body;

    const apiClient = getApiClient(req);
    const url = backend_api_urls.PRODUCT_SUITE.Notification_Template.CREATE;
    const isActive = is_active === "true" || is_active === true;
    const isSystem = is_system === "true" || is_system === true;

    const requests = [];
    if (body_en && body_en.trim()) {
      requests.push({ lang: "EN", payload: { organization_id: organizationId, notification_type, language: "EN", name, subject: subject_en || null, body: body_en, is_active: isActive, is_system: isSystem } });
    }
    if (body_ar && body_ar.trim()) {
      requests.push({ lang: "AR", payload: { organization_id: organizationId, notification_type, language: "AR", name, subject: subject_ar || null, body: body_ar, is_active: isActive, is_system: isSystem } });
    }

    logger.info(`Controller - [Notification Template - Create] - Submitting ${requests.map(r => r.lang).join(" + ")} template(s) in parallel`);
    requests.forEach(({ lang, payload }) => logger.info(`Controller - [Notification Template - Create] - Payload [${lang}]: ${JSON.stringify(payload, null, 2)}`));
    const results = await Promise.all(requests.map(({ payload }) => apiClient.post(url, payload)));

    const errors = results
      .map((res, i) => (!res?.data?.success ? `${requests[i].lang}: ${res?.data?.message || "Failed"}` : null))
      .filter(Boolean);

    if (errors.length > 0) {
      req.flash("alertType", "error");
      req.flash("message", errors.join(" | "));
      return res.redirect(frontend_api_urls.PRODUCT_SUITE.Notification_Template.CREATE);
    }

    logger.info(`Controller - [Notification Template - Create] - Template(s) created successfully`);
    req.flash("alertType", "success");
    req.flash("message", req.__("settings.notificationTemplate.create.success"));
    return res.redirect(frontend_api_urls.PRODUCT_SUITE.Notification_Template.LIST);
  } catch (error) {
    logger.error(`Controller - [Notification Template - Create] - ${error.message}`);
    logger.error(`Controller - [Notification Template - Create] - ${error.stack}`);
    req.flash("alertType", "error");
    req.flash("message", error.response?.data?.message || req.__("settings.notificationTemplate.create.error"));
    return res.redirect(frontend_api_urls.PRODUCT_SUITE.Notification_Template.CREATE);
  }
};
