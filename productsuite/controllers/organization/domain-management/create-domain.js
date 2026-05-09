const { logger } = require('../../../../logger/logger');
const getApiClient = require('../../../../utility/api-client');

exports.createDomain = async (req, res) => {
    const orgId = req.body.organization_id;
    try {
        logger.info(`[DomainManagement] Creating domain for orgId=${orgId}, domain=${req.body.domain_name}`);

        const apiClient = getApiClient(req);
        await apiClient.post(`/dms/${orgId}/organization`, {
            domain_name: req.body.domain_name,
            is_active: req.body.is_active === '1',
        });

        req.flash('message', req.__('org_domain.create_success'));
        req.flash('alertType', 'success');
        return res.redirect(`/dms/${orgId}/organization`);
    } catch (error) {
        logger.error(`[DomainManagement] createDomain error: ${error.message}`);
        req.flash('message', req.__('org_domain.create_error'));
        req.flash('alertType', 'error');
        return res.redirect(`/dms/domain/${orgId}`);
    }
};
