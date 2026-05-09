const backend_api_urls = require('../../../../config/backend_api_urls');
const frontend_api_urls = require('../../../../config/frontend_api_urls');
const { logger } = require('../../../../logger/logger');
const getApiClient = require('../../../../utility/api-client');

exports.deleteDomain = async (req, res) => {
    const domainId = req.params.domainId;
    const domainOrgId = req.params.domainOrgId;
    try {
        logger.info(`[DomainManagement] Deleting domainId=${domainId}`);
        const organizationId = req.user.organization_id;
        if (organizationId) {
            req.flash('message', req.__('org_domain.not_authorized'));
            req.flash('alertType', 'error');
            return res.redirect(`/home`);
        }
        const apiClient = getApiClient(req);
        await apiClient.delete(backend_api_urls.PRODUCT_SUITE.DOMAIN_MANAGEMENT.DELETE(domainOrgId, domainId));

        req.flash('message', req.__('org_domain.delete_success'));
        req.flash('alertType', 'success');
        return res.redirect(frontend_api_urls.PRODUCT_SUITE.Domain_Management.Render_List_View(domainOrgId));
    } catch (error) {
        logger.error(`[DomainManagement] deleteDomain error: ${error.message}`);
        req.flash('message', req.__('org_domain.delete_error'));
        req.flash('alertType', 'error');
        return res.redirect(frontend_api_urls.PRODUCT_SUITE.Domain_Management.Render_List_View(domainOrgId));
    }
};
