const backend_api_urls = require("../../../config/backend_api_urls");
const frontend_api_urls = require("../../../config/frontend_api_urls");
const { logger } = require("../../../logger/logger");
const { redactString } = require("../../../utility/redact");
const getApiClient = require('../../../utility/api-client')

exports.disableTemplate = async (req, res) => {
  logger.info('Controller - Disable Template: Incoming request in disable Template method')
  try {

    let templateId = req.params.templateId;

    if (!templateId || isNaN(Number(templateId))) {
      req.flash('message', 'Invalid templateId. Must be a valid number.');
      req.flash('alertType', 'error');
      return res.redirect(frontend_api_urls.PRODUCT_SUITE.System_Template.LIST);
    };

    const apiClient = getApiClient(req);

    const queryParams = {
      organizationId: null,
    };
    if (queryParams.organizationId === undefined) {
      req.flash('message', 'Invalid template organization');
      req.flash('alertType', 'error');
      return res.redirect(frontend_api_urls.PRODUCT_SUITE.System_Template.LIST);
    }
    const url = backend_api_urls.PRODUCT_SUITE.Template.DELETE(templateId, { queryParams });
    logger.info('Controller - Disable Template: API URL::: ' + redactString(url))
    const response = await apiClient.delete(url);

    if (!response.data.success) {
      req.flash('message', response.data.message || 'Unable to delete template');
      req.flash('alertType', 'error');
      return res.redirect(frontend_api_urls.PRODUCT_SUITE.System_Template.LIST);
    }
    req.flash('message', req.__('Template.template_deleted_successfully'));
    req.flash('alertType', 'success');
    const redirectUrl = frontend_api_urls.PRODUCT_SUITE.System_Template.LIST;
    return res.redirect(redirectUrl)

  } catch (error) {
    logger.error("Controller - Disable Template: Exception in delete template" + redactString(error.message || String(error)));
    logger.error(redactString(error.stack || ""))
    req.flash('message', 'Unable to delete template');
    req.flash('alertType', 'error');
    return res.redirect(frontend_api_urls.PRODUCT_SUITE.System_Template.LIST);

  }
};
