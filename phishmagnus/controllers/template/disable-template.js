const backend_api_urls = require("../../../config/backend_api_urls");
const config = require("../../../config/env.config");
const frontend_api_urls = require("../../../config/frontend_api_urls");

const { logger } = require("../../../logger/logger");
const getApiClient = require('../../../utility/api-client')

exports.disableTemplate = async (req, res) => {
  logger.info('Controller - Disable Template: Incoming request in disable Template method')
  try {

    let templateId = req.params.templateId;

    if (!templateId || isNaN(Number(templateId))) {
      req.flash('message', 'Invalid templateId. Must be a valid number.');
      req.flash('alertType', 'error');
      return res.redirect(frontend_api_urls.PHISHMAGNUS.Template.LIST);
    };

    const apiClient = getApiClient(req);

    const queryParams = {
      organizationId: req.user.organization_id ? req.user.organization_id : undefined,
    };
    if (queryParams.organizationId === undefined) {
      req.flash('message', 'Invalid template organization');
      req.flash('alertType', 'error');
      return res.redirect(frontend_api_urls.PHISHMAGNUS.Home);
    }
    const url = backend_api_urls.PRODUCT_SUITE.Template.PHM_DELETE(templateId, { queryParams });
    logger.info('Controller - Disable Template: API URL::: ' + url)
    const response = await apiClient.delete(url);

    if (!response.data.success) {
      req.flash('message', response.data.message || 'Unable to delete template');
      req.flash('alertType', 'error');
      return res.redirect(frontend_api_urls.PHISHMAGNUS.Template.LIST);
    }
    req.flash('message', req.__('Template.template_deleted_successfully'));
    req.flash('alertType', 'success');
    const redirectUrl = frontend_api_urls.PHISHMAGNUS.Template.LIST;
    return res.redirect(redirectUrl)

  } catch (error) {
    logger.error("Controller - Disable Template: Exception in delete template" + error);
    logger.error(error.stack)
    
    if (error.response && error.response.status === 403) {
      const errorMessage = error.response.data?.message || 'Access Denied';
      logger.warn(`[Disable Template] Access denied: ${errorMessage}`);
      
      if (errorMessage.toLowerCase().includes('subscription')) {
        // Subscription error - redirect to home with message
        if (req.session) {
          req.flash('message', 'You do not have an active subscription to delete templates.');
          req.flash('alertType', 'error');
        }
        return res.redirect(frontend_api_urls.PHISHMAGNUS.Home.INDEX);
      }
    }
    
    if (req.session) {
      req.flash('message', 'Unable to delete template');
      req.flash('alertType', 'error');
    }
    return res.redirect(frontend_api_urls.PHISHMAGNUS.Template.LIST);

  }
};