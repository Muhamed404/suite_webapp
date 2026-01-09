const backend_api_urls = require('../../../config/backend_api_urls');
const render_ejs_urls = require('../../../config/render_ejs_urls');
const logger = require('../../../logger/logger').logger;
const getApiClient = require('../../../utility/api-client');

// Render form
exports.retrieveAppServices = async (req, res) => {
  try {
    const url = backend_api_urls.PRODUCT_SUITE.Application_Service.LIST;
    const apiClient = getApiClient(req);

    const response = await apiClient.get(url);


    const data = response.data || {};
    const appServices = data.object ?? data.result ?? []; // support multiple shapes

    logger.info(`[APP_SERVICE][LIST] Retrieved summary:${JSON.stringify(appServices, null, 2)}`);


    return res.render(render_ejs_urls.ProductSuiteManagement.App_Service.LIST, {
      enableSuiteManagementLeftMenu: true,
      appServices,
    });

  } catch (error) {
    logger.error(`[APP_SERVICE][LIST] Error: ${error.message}`);
    const userMessage = error.response?.data?.message || error.response?.data?.error || "Error fetching packages";
    return res.status(404).render('pages/404', {
      message: error.message || 'Resource not found',
      alertType: 'error'
    });
  }
};

