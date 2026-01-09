const backend_api_urls = require('../../../config/backend_api_urls');
const frontend_api_urls = require('../../../config/frontend_api_urls');
const render_ejs_urls = require('../../../config/render_ejs_urls');
const getApiClient = require('../../../utility/api-client');
const logger = require('../../../logger/logger').logger;
const { validationResult } = require('express-validator');

// Render form
exports.renderCreateForm = async (req, res) => {
  logger.info('[APP SERVICE][GET] Render create app service form - START');
  try {
    logger.info(`[APP SERVICE][GET] Fetching applications from: ${backend_api_urls.PRODUCT_SUITE.Application.LIST}`);
    const apiClient = getApiClient(req);
    const response = await apiClient.get(backend_api_urls.PRODUCT_SUITE.Application.LIST);
    const applications = response.data?.object || [];

    logger.info(`[APP SERVICE][GET] Applications fetched: count=${applications.length}`);
    logger.info(`[APP SERVICE][GET] Applications response: ${JSON.stringify(applications, null, 2)}`);
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
      message: "Could not load applications."
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
    errors.push('Please select a product.');
  }
  if (!service_name || typeof service_name !== 'string' || service_name.trim().length < 2) {
    errors.push('Service name must be at least 2 characters.');
  }
  if (!service_type || typeof service_type !== 'string' || !['Fixed', 'Annual'].includes(service_type)) {
    errors.push('Please select a valid service type.');
  }
  if (!service_detail || typeof service_detail !== 'string' || service_detail.trim().length < 2) {
    errors.push('Description must be at least 2 characters.');
  }
  let cost = 0;
  if (!per_service_cost || isNaN(parseInt(per_service_cost, 10))) {
    errors.push('Please enter a valid service cost.');
  } else {
    cost = parseInt(per_service_cost, 10);
    if (cost < 1) {
      errors.push('Service cost must be at least 1.');
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
    logger.info(`[APP SERVICE][POST] Final payload to backend: ${JSON.stringify(payload, null, 2)}`);
    // Send to backend API via apiClient
    const apiUrl = backend_api_urls.PRODUCT_SUITE.Application_Service.CREATE;
    logger.info(`[APP SERVICE][POST] Sending POST request to: ${apiUrl}`);
    const response = await apiClient.post(apiUrl, payload);
    logger.info(`[APP SERVICE][POST] Backend response: ${JSON.stringify(response.data)}`);

    if (!response.data.success) {
      logger.error(`[APP SERVICE][POST] Backend returned error status: ${response.data.message}`);
      req.flash('alertType', 'error');
      req.flash('message', 'Unable to create service. Please try again.');
      return res.redirect(frontend_api_urls.PRODUCT_SUITE.App_Service.CREATE);

    }
    // success redirect
    req.flash('alertType', 'success');
    req.flash('message', 'Service has been created successfully.');
    return res.redirect(frontend_api_urls.PRODUCT_SUITE.App_Service.LIST);

  } catch (error) {
    logger.error(`[APP SERVICE][POST] Error creating app service: ${error.message}`);
    logger.error(error.stack);
    req.flash('alertType', 'error');
    req.flash('message', 'Unable to create service. Please try again.');
    return res.redirect(frontend_api_urls.PRODUCT_SUITE.App_Service.CREATE);
  }
};