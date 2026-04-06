const { logger } = require('../../../../logger/logger');
const getApiClient = require('../../../../utility/api-client');
const backend_api_urls = require('../../../../config/backend_api_urls');
const frontend_api_urls = require('../../../../config/frontend_api_urls');

exports.toggleRestrict = async (req, res) => {
    const { orgId, isActive } = req.params;
    const domainRestrict = isActive === '1';
    try {
        logger.info(`[DomainManagement] Toggling domain_restrict for orgId=${orgId} to ${domainRestrict}`);

        const apiClient = getApiClient(req);
        await apiClient.patch(backend_api_urls.PRODUCT_SUITE.DOMAIN_MANAGEMENT.TOGGLE_RESTRICT(orgId), {
            domain_restrict: domainRestrict,
        });

        req.flash('message', domainRestrict ? 'Domain restriction enabled.' : 'Domain restriction disabled.');
        req.flash('alertType', 'success');
    } catch (error) {
        logger.error(`[DomainManagement] toggleRestrict error: ${error.message}`);
        const errMsg = error.response?.data?.message || error.message || 'Failed to update domain restriction.';
        req.flash('message', errMsg);
        req.flash('alertType', 'error');
    }

    const On = req.query.On || '';
    return res.redirect(`${frontend_api_urls.PRODUCT_SUITE.Domain_Management.Render_List_View(orgId)}?On=${encodeURIComponent(On)}`);
};
