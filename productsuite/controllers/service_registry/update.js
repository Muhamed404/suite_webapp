const { logger } = require("../../../logger/logger");
const getApiClient = require('../../../utility/api-client');
const render_ejs_urls = require("../../../config/render_ejs_urls");
const frontend_api_urls = require("../../../config/frontend_api_urls");
const backend_api_urls = require("../../../config/backend_api_urls");
const { redactLogData } = require("../../../phishmagnus/utility/redact");


const logTxn = 'Controller - [Service Registry - Update]';

exports.renderUpdateForm = async (req, res) => {
  logger.info(`Controller - [Service Registry - Update]: Incoming request to render update form for service with ID ${JSON.stringify(redactLogData(req.params), null, 2)}`);
  try {
    const serviceId = req.params?.service_id || null;
    const registryId = req.params?.registry_id || null;

    if (!serviceId || !registryId) {
      logger.warn(`Controller - [Service Registry - Update]: Invalid service ID passed: ${serviceId}`);
      req.flash("message", req.__("generic_label.invalid_service_id_passed"));
      req.flash("alertType", "error");
      return res.redirect(frontend_api_urls.PRODUCT_SUITE.Service_Registry.LIST);
    }

    const apiClient = getApiClient(req);
    const serviceResponse = await apiClient.get(backend_api_urls.PRODUCT_SUITE.SERVICE_REGISTRY.RENDER_UPDATE_FORM(serviceId, registryId));
    logger.info(`Controller - [Service Registry - Update]: Response from API: ${JSON.stringify(redactLogData(serviceResponse.data), null, 2)}`);

    // Handle service not found or error from API 
    if (!serviceResponse.data.success) {
      req.flash("message", serviceResponse.data.message || req.__("generic_label.service_not_found"));
      req.flash("alertType", "error");
      return res.redirect(frontend_api_urls.PRODUCT_SUITE.Service_Registry.LIST);
    }

    // Prepare render data
    const renderData = {
      service: serviceResponse.data.object,
      enableSuiteManagementLeftMenu: true,
    };
    // logger.info(`Controller - [Service Registry - Update]: Rendering edit service page for service ID ${JSON.stringify(renderData, null, 2)}`);
    res.render(render_ejs_urls.ProductSuiteManagement.Service_Registry.EDIT_SERVICE, renderData);
  } catch (error) {
    logger.error(`Error Controller - [Service Registry - Update]: ${error}`);
    logger.error(`Error Controller - [Service Registry - Update]: ${error.stack}`);
    req.flash("message", error?.response?.data?.message || req.__('generic_label.error_in_retrieving_service'));
    req.flash("alertType", "error");
    return res.redirect(frontend_api_urls.PRODUCT_SUITE.Service_Registry.LIST);
  }
};

exports.submitUpdateForm = async (req, res) => {
  logger.info(`${logTxn}: Incoming request to update service with ID ${JSON.stringify(redactLogData(req.params), null, 2)}`);
  try {
    const serviceId = req.params?.service_id.trim() || null;

    if (!serviceId) {
      logger.warn(`${logTxn}: Invalid service ID passed: ${serviceId}`);
      req.flash("message", req.__("generic_label.invalid_service_id"));
      req.flash("alertType", "error");
      return res.redirect(frontend_api_urls.PRODUCT_SUITE.Service_Registry.LIST);
    }

    const payload = req.body || {};
    const { serviceId: service_id, serviceType: service_type, public_key, serviceName: service_name, status } = payload;

    if (!service_id || !service_type || !public_key || !service_name || typeof status === 'undefined') {
      logger.warn(`${logTxn}: Incomplete payload received: ${JSON.stringify(redactLogData(payload))}`);
      req.flash("message", req.__("generic_label.incomplete_data_submitted"));
      req.flash("alertType", "error");
      return res.redirect(frontend_api_urls.PRODUCT_SUITE.Service_Registry.EDIT_SERVICE(serviceId));
    }

    const apiClient = getApiClient(req);
    const serviceResponse = await apiClient.post(backend_api_urls.PRODUCT_SUITE.SERVICE_REGISTRY.UPDATE_SERVICE(serviceId), payload);
    logger.info(`${logTxn}: Response from API: ${JSON.stringify(redactLogData(serviceResponse.data), null, 2)}`);

    // Handle user not found or error from API
    if (!serviceResponse.data.success) {
      req.flash("message", serviceResponse.data.message || req.__("generic_label.error_in_saving_service"));
      req.flash("alertType", "error");
      return res.redirect(frontend_api_urls.PRODUCT_SUITE.Service_Registry.EDIT_SERVICE(serviceId));
    }

    req.flash("message", req.__("generic_label.service_updated_successfully"));
    req.flash("alertType", "success");
    res.redirect(frontend_api_urls.PRODUCT_SUITE.Service_Registry.LIST);
  } catch (error) {
    logger.error(`Error ${logTxn}: ${error}`);
    logger.error(`Error ${logTxn}: ${error.stack}`);
    req.flash("message", error?.response?.data?.message || req.__('generic_label.error_in_saving_service'));
    req.flash("alertType", "error");
    return res.redirect(frontend_api_urls.PRODUCT_SUITE.Service_Registry.LIST);
  }
};
