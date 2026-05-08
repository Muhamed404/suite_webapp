const backend_api_urls = require("../../../config/backend_api_urls");
const frontend_api_urls = require("../../../config/frontend_api_urls");
const { logger } = require("../../../logger/logger");
const getApiClient = require('../../../utility/api-client');

// Helper to check if request is AJAX
const isAjaxRequest = (req) => {
  return req.headers['x-requested-with'] === 'XMLHttpRequest' ||
         req.headers['accept']?.includes('application/json');
};

// Helper to send JSON response for AJAX or redirect for regular requests
const sendResponse = (req, res, success, message, redirectUrl) => {
  if (isAjaxRequest(req)) {
    return res.status(success ? 200 : 400).json({
      alertType: success ? 'success' : 'error',
      message: message,
      redirectUrl: redirectUrl
    });
  } else {
    req.flash('message', message);
    req.flash('alertType', success ? 'success' : 'error');
    return res.redirect(redirectUrl);
  }
};

exports.deleteGroup = async (req, res) => {
  logger.info('Controller - Delete Group: Incoming request in delete Group method');
  try {
    let groupId = req.params.groupId;

    if (!groupId || isNaN(Number(groupId))) {
      return sendResponse(req, res, false, 'Invalid groupId. Must be a valid number.', frontend_api_urls.PHISHMAGNUS.Group.List);
    }

    const apiClient = getApiClient(req);

    const queryParams = {
      organizationId: req.user.organization_id ? req.user.organization_id : undefined,
    };

    if (queryParams.organizationId === undefined) {
      return sendResponse(req, res, false, 'Invalid organization', frontend_api_urls.PHISHMAGNUS.Group.List);
    }

    const url = backend_api_urls.PHISHMAGNUS.GROUPS.DELETE(groupId);
    logger.info('Controller - Delete Group: API URL::: ' + url);
    const response = await apiClient.delete(url, { params: queryParams });

    // Backend returns alertType, not success flag
    if (response.data.alertType !== 'success') {
      return sendResponse(req, res, false, response.data.message || 'Unable to delete group', frontend_api_urls.PHISHMAGNUS.Group.List);
    }

    return sendResponse(req, res, true, req.__('group.group_deleted_successfully') || 'Group deleted successfully', frontend_api_urls.PHISHMAGNUS.Group.List);

  } catch (error) {
    logger.error("Controller - Delete Group: Exception in delete group" + error);
    logger.error(error.stack);

    if (error.response && error.response.status === 403) {
      const errorMessage = error.response.data?.message || 'Access Denied';
      logger.warn(`[Delete Group] Access denied: ${errorMessage}`);

      if (errorMessage.toLowerCase().includes('subscription')) {
        return sendResponse(req, res, false, 'You do not have an active subscription to delete groups.', frontend_api_urls.PHISHMAGNUS.Home.INDEX);
      }
    }

    return sendResponse(req, res, false, 'Unable to delete group', frontend_api_urls.PHISHMAGNUS.Group.List);
  }
};
