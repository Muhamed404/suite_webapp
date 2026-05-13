const backend_api_urls = require('../../../config/backend_api_urls');
const frontend_api_urls = require('../../../config/frontend_api_urls');
const render_ejs_urls = require('../../../config/render_ejs_urls');
const getApiClient = require('../../../utility/api-client');
const logger = require('../../../logger/logger').logger;
const { validationResult } = require('express-validator');
const { redactLogData } = require('../../../utility/redact');

// Render form
exports.renderCreateForm = async (req, res) => {
  logger.info('[APP SERVICE][GET] Render create app service form - START');
  try {
    logger.info(`[APP SERVICE][GET] Fetching applications from: ${backend_api_urls.PRODUCT_SUITE.Application.LIST}`);
    const apiClient = getApiClient(req);
    const response = await apiClient.get(backend_api_urls.PRODUCT_SUITE.Application.LIST);
    const applications = response.data?.object || [];

    logger.info(`[APP SERVICE][GET] Applications fetched: count=${applications.length}`);
    logger.info(`[APP SERVICE][GET] Applications response: ${JSON.stringify(redactLogData(applications), null, 2)}`);
    res.render(render_ejs_urls.ProductSuiteManagement.App_Service.CREATE, {
      enableSuiteManagementLeftMenu: true,
      applications,
      message: 'undefined'
    });

    logger.info('[APP SERVICE][GET] Rendered create_app_service page successfully');
  } catch (error) {
    logger.error(`[APP SERVICE][GET] Error fetching applications: ${error.message}`);
    logger.error(error.stack);
    res.render(render_ejs_urls.ProductSuiteManagement.App_Service.CREATE, {
      applications: [],
      message: req.__('appservice.create.errorCouldNotLoadApplications')
    });
  }
};

// Handle form POST
exports.createAppService = async (req, res) => {
  logger.info('[APP SERVICE][POST] Create app service - START');
  logger.info('[APP SERVICE][POST] Payload to backend prepared');

  // Server-side validation (same as client-side)
  const errors = [];
  const { application, service_name, service_detail, service_type, per_service_cost } = req.body;
  if (!application || isNaN(parseInt(application, 10))) {
    errors.push(req.__('appservice.create.validationSelectProduct'));
  }
  if (!service_name || typeof service_name !== 'string' || service_name.trim().length < 2) {
    errors.push(req.__('appservice.create.validationServiceNameMinLength'));
  }
  if (!service_type || typeof service_type !== 'string' || !['Fixed', 'Annual'].includes(service_type)) {
    errors.push(req.__('appservice.create.validationSelectServiceType'));
  }
  if (!service_detail || typeof service_detail !== 'string' || service_detail.trim().length < 2) {
    errors.push(req.__('appservice.create.validationDescriptionMinLength'));
  }
  let cost = 0;
  if (!per_service_cost || isNaN(parseInt(per_service_cost, 10))) {
    errors.push(req.__('appservice.create.validationEnterServiceCost'));
  } else {
    cost = parseInt(per_service_cost, 10);
    if (cost < 1) {
      errors.push(req.__('appservice.create.validationServiceCostMin'));
    }
  }

  if (errors.length > 0) {
    // Fetch applications for re-render
    req.flash('error', 'error');
    req.flash('message', errors.join(' '));
    return res.redirect(frontend_api_urls.PRODUCT_SUITE.App_Service.CREATE);
  }

  try {
    const apiClient = getApiClient(req);
    const payload = {
      app_id: parseInt(application, 10),
      service_name: service_name.trim(),
      service_detail: service_detail.trim(),
      service_type: service_type,
      per_service_cost: cost,
    };
    logger.info(`[APP SERVICE][POST] Final payload to backend: ${JSON.stringify(redactLogData(payload), null, 2)}`);
    // Send to backend API via apiClient
    const apiUrl = backend_api_urls.PRODUCT_SUITE.Application_Service.CREATE;
    logger.info(`[APP SERVICE][POST] Sending POST request to: ${apiUrl}`);
    const response = await apiClient.post(apiUrl, payload);
    logger.info(`[APP SERVICE][POST] Backend response: ${JSON.stringify(redactLogData(response.data))}`);

    if (!response.data.success) {
      logger.error(`[APP SERVICE][POST] Backend returned error status: ${response.data.message}`);
      req.flash('alertType', 'error');
      req.flash('message', req.__('appservice.create.errorUnableToCreate'));
      return res.redirect(frontend_api_urls.PRODUCT_SUITE.App_Service.CREATE);

    }
    // success redirect
    req.flash('alertType', 'success');
    req.flash('message', req.__('appservice.create.successMessage'));
    return res.redirect(frontend_api_urls.PRODUCT_SUITE.App_Service.LIST);

  } catch (error) {
    logger.error(`[APP SERVICE][POST] Error creating app service: ${error.message}`);
    logger.error(error.stack);
    req.flash('alertType', 'error');
    req.flash('message', 'Unable to create service. Please try again.');
    return res.redirect(frontend_api_urls.PRODUCT_SUITE.App_Service.CREATE);
  }
};

// Delete app service
exports.deleteAppService = async (req, res) => {
  logger.info(`[APP SERVICE][DELETE] Delete app service - START`);
  
  try {
    const { id } = req.params;
    logger.info(`[APP SERVICE][DELETE] Deleting app service with id: ${id}`);

    if (!id || isNaN(parseInt(id, 10))) {
      logger.warn(`[APP SERVICE][DELETE] Invalid id provided: ${id}`);
      return res.redirect(`${frontend_api_urls.PRODUCT_SUITE.App_Service.LIST}?message=${encodeURIComponent('Invalid service ID')}&alertType=error`);
    }

    const apiClient = getApiClient(req);
    const apiUrl = `${backend_api_urls.PRODUCT_SUITE.Application_Service.DELETE}/${id}`;
    logger.info(`[APP SERVICE][DELETE] Calling DELETE API: ${apiUrl}`);

    const response = await apiClient.delete(apiUrl);
    logger.info(`[APP SERVICE][DELETE] Delete response: ${JSON.stringify(redactLogData(response.data))}`);

    const message = response.data?.message || response.data?.msg || 'Service deleted successfully';
    const alertType = response.data?.alertType || 'success';

    logger.info(`[APP SERVICE][DELETE] Redirecting to list with message: ${message}`);
    return res.redirect(`${frontend_api_urls.PRODUCT_SUITE.App_Service.LIST}?message=${encodeURIComponent(message)}&alertType=${encodeURIComponent(alertType)}`);
  } catch (error) {
    logger.error(`[APP SERVICE][DELETE] Error deleting app service: ${error.message}`);
    logger.error(`[APP SERVICE][DELETE] Error stack: ${error.stack}`);
    
    const message = error.response?.data?.message || error.response?.data?.msg || error.message || 'Error deleting service';
    const alertType = error.response?.data?.alertType || 'error';

    logger.error(`[APP SERVICE][DELETE] Redirecting to list with error: ${message}`);
    return res.redirect(`${frontend_api_urls.PRODUCT_SUITE.App_Service.LIST}?message=${encodeURIComponent(message)}&alertType=${encodeURIComponent(alertType)}`);
  }
};