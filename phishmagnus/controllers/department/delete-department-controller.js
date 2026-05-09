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

exports.deleteDepartment = async (req, res) => {
  logger.info('Controller - Delete Department: Incoming request in delete Department method');
  try {
    let departmentId = req.params.departmentId;

    if (!departmentId || isNaN(Number(departmentId))) {
      return sendResponse(req, res, false, 'Invalid departmentId. Must be a valid number.', '/department/list');
    }

    const apiClient = getApiClient(req);

    const queryParams = {
      organizationId: req.user.organization_id ? req.user.organization_id : undefined,
    };

    if (queryParams.organizationId === undefined) {
      return sendResponse(req, res, false, 'Invalid organization', '/department/list');
    }

    const url = backend_api_urls.PHISHMAGNUS.DEPARTMENT.DELETE(departmentId);
    logger.info('Controller - Delete Department: API URL::: ' + url);
    const response = await apiClient.delete(url, { params: queryParams });

    // Backend returns alertType, not success flag
    if (response.data.alertType !== 'success') {
      return sendResponse(req, res, false, response.data.message || 'Unable to delete department', '/department/list');
    }

    return sendResponse(req, res, true, req.__('department.department_deleted_successfully') || 'Department deleted successfully', '/department/list');

  } catch (error) {
    logger.error("Controller - Delete Department: Exception in delete department" + error);
    logger.error(error.stack);

    if (error.response && error.response.status === 403) {
      const errorMessage = error.response.data?.message || 'Access Denied';
      logger.warn(`[Delete Department] Access denied: ${errorMessage}`);

      if (errorMessage.toLowerCase().includes('subscription')) {
        return sendResponse(req, res, false, 'You do not have an active subscription to delete departments.', '/home');
      }
    }

    return sendResponse(req, res, false, 'Unable to delete department', '/department/list');
  }
};
