const backend_api_urls = require("../../../config/backend_api_urls");
const frontend_api_urls = require("../../../config/frontend_api_urls");
const { logger } = require("../../../logger/logger");
const { redactString } = require("../../../utility/redact");
const getApiClient = require('../../../utility/api-client');

const logTxn = 'Controller - [Service Registry - Delete]';

exports.deleteService = async (req, res) => {
    const { registry_id, service_id } = req.params;
    logger.info(`${logTxn} - Received request to delete service registry with id: ${redactString(String(service_id))}`);
    try {
        if (!registry_id || !service_id) {
            logger.warn(`${logTxn} - Missing registry_id or service_id in request parameters`);
            req.flash('message', req.__('generic_label.invalid_request_parameters'));
            req.flash('alertType', 'error');
            return res.redirect(frontend_api_urls.PRODUCT_SUITE.Service_Registry.LIST);
        }
        const apiClient = getApiClient(req);
        const backendUrl = backend_api_urls.PRODUCT_SUITE.SERVICE_REGISTRY.DELETE_SERVICE(registry_id, service_id); // Adjust if you add to backend_api_urls.js
        const response = await apiClient.delete(backendUrl);
        if (response?.data?.success) {
            logger.info(`${logTxn} - Service registry deleted successfully`);
            req.flash('message', req.__('generic_label.service_deleted_successfully'));
            req.flash('alertType', 'success');
        } else {
            logger.warn(`${logTxn} - Service registry deletion failed: ${redactString(response.data.message || "")}`);
            req.flash('message', response.data.message || req.__('generic_label.service_registry_deletion_failed'));
            req.flash('alertType', 'error');
        }
    } catch (error) {
        logger.error(`${logTxn} - Error deleting service registry: ${redactString(error.message || String(error))}`);
        req.flash('message', error.response?.data?.message || req.__('generic_label.unable_to_delete_service_registry'));
        req.flash('alertType', 'error');
    }
    return res.redirect(frontend_api_urls.PRODUCT_SUITE.Service_Registry.LIST);
};
