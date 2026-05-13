const { logger } = require('../../../../logger/logger');
const getApiClient = require('../../../../utility/api-client');
const backend_api_urls = require('../../../../config/backend_api_urls');
const frontend_api_urls = require('../../../../config/frontend_api_urls');
const { redactLogData } = require("../../../../utility/redact");

exports.editDomain = async (req, res) => {
    const { domain_id, domain_name, is_active } = req.body;
    const domainOrgId = req.params.domainOrgId;
    try {
        logger.info(`[DomainManagement] Editing domainId=${redactLogData(domain_id)}`);

        const apiClient = getApiClient(req);
        await apiClient.put(backend_api_urls.PRODUCT_SUITE.DOMAIN_MANAGEMENT.EDIT(domain_id), {
            domain_name,
            is_active: is_active === '1',
        });

        req.flash('message', req.__('org_domain.update_success'));
        req.flash('alertType', 'success');
        return res.redirect(frontend_api_urls.PRODUCT_SUITE.Domain_Management.Render_List_View(domainOrgId));
    } catch (error) {
        logger.error(`[DomainManagement] editDomain error: ${redactLogData(error.message)}`);
        req.flash('message', req.__('org_domain.update_error'));
        req.flash('alertType', 'error');
        return res.redirect(frontend_api_urls.PRODUCT_SUITE.Domain_Management.Render_List_View(domainOrgId));

    }
};
