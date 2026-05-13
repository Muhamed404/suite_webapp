const { logger } = require('../../../../logger/logger');
const { redactLogData, redactString } = require('../../../../utility/redact');
const getApiClient = require('../../../../utility/api-client');
const backend_api_urls = require('../../../../config/backend_api_urls');
const frontend_api_urls = require('../../../../config/frontend_api_urls');

exports.toggleRestrict = async (req, res) => {
    const { orgId, isActive } = req.params;
    const domainRestrict = isActive === '1';
    try {
        logger.info(`[DomainManagement] Toggling domain_restrict for orgId=${redactLogData(orgId)} to ${domainRestrict}`);

        const apiClient = getApiClient(req);
        await apiClient.patch(backend_api_urls.PRODUCT_SUITE.DOMAIN_MANAGEMENT.TOGGLE_RESTRICT(orgId), {
            domain_restrict: domainRestrict,
        });

        req.flash('message', domainRestrict ? req.__('org_domain.restrict_enable_success') : req.__('org_domain.restrict_disable_success'));
        req.flash('alertType', 'success');
    } catch (error) {
        logger.error(`[DomainManagement] toggleRestrict error: ${redactString(error.message || String(error))}`);
        req.flash('message', req.__('org_domain.restrict_update_error'));
        req.flash('alertType', 'error');
    }

    const On = req.query.On || '';
    return res.redirect(`${frontend_api_urls.PRODUCT_SUITE.Domain_Management.Render_List_View(orgId)}?On=${encodeURIComponent(On)}`);
};
