const { logger } = require('../../../../logger/logger');
const getApiClient = require('../../../../utility/api-client');
const backend_api_urls = require('../../../../config/backend_api_urls');
const frontend_api_urls = require('../../../../config/frontend_api_urls');
const { redactLogData } = require("../../../../utility/redact");

exports.toggleDomain = async (req, res) => {
    const { domainOrgId, domainId, isActive } = req.params;
    try {
        logger.info(`[DomainManagement] Toggling domainId=${redactLogData(domainId)} to is_active=${redactLogData(isActive)}`);

        const apiClient = getApiClient(req);
        await apiClient.put(backend_api_urls.PRODUCT_SUITE.DOMAIN_MANAGEMENT.EDIT(domainId), {
            is_active: isActive === '1',
        });

        req.flash('message', isActive === '1' ? req.__('org_domain.enable_success') : req.__('org_domain.disable_success'));
        req.flash('alertType', 'success');
        return res.redirect(frontend_api_urls.PRODUCT_SUITE.Domain_Management.Render_List_View(domainOrgId));
    } catch (error) {
        logger.error(`[DomainManagement] toggleDomain error: ${redactLogData(error.message)}`);
        req.flash('message', req.__('org_domain.status_update_error'));
        req.flash('alertType', 'error');
        return res.redirect(frontend_api_urls.PRODUCT_SUITE.Domain_Management.Render_List_View(domainOrgId));
    }
};
