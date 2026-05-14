const backend_api_urls = require('../../../../config/backend_api_urls');
const render_ejs_urls = require('../../../../config/render_ejs_urls');
const { logger } = require('../../../../logger/logger');
const getApiClient = require('../../../../utility/api-client');
const enums = require('../../../../contants/enum');
const { redactLogData } = require("../../../../utility/redact");
exports.listDomains = async (req, res) => {
    try {
        const orgId = req.params.orgId;
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;

        logger.info(`[DomainManagement] Listing domains for orgId=${redactLogData(orgId)}, page=${page}`);

        const apiClient = getApiClient(req);
        const domainsRes = await apiClient.get(backend_api_urls.PRODUCT_SUITE.DOMAIN_MANAGEMENT.LIST_BY_ORGANIZATION(orgId), {
            params: { page, pageSize }
        });

        const data = domainsRes?.data?.data || {};
        // console.log('Domain list response data:', JSON.stringify(data, null, 2));
        const domains = data.rows || [];
        const totalCount = data.count || 0;
        const totalPages = Math.ceil(totalCount / pageSize);
        const domainRestriction = data.domain_restriction;

        const userPermissions = req.permissions || [];
        const isReadOnly = userPermissions.some(
            perm =>
                perm?.module?.toLowerCase() === enums.ModuleNames.Domain_Management.toLowerCase() &&
                perm?.name?.toLowerCase() === enums.Access_Types.R_O.toLowerCase()
        );
        // console.log('User permissions:', JSON.stringify(userPermissions, null, 2));
        // console.log('Is read-only access:', isReadOnly);
        return res.render(render_ejs_urls.ProductSuiteManagement.Domain_Management.Render_List_DMS, {
            domains,
            enableSuiteManagementLeftMenu: true,

            isReadOnly,
            domainRestriction,
            orgId,
            orgName: req.query.On || '',
            domainRestrict: req.query.dr === '1',
            pagination: { currentPage: page, totalPages, pageSize, count: totalCount },
            user: req.user,
            locale: req.getLocale ? req.getLocale() : 'en',
        });
    } catch (error) {
        logger.error(`[DomainManagement] listDomains error: ${redactLogData(error.message)}`);
        req.flash('message', 'Failed to load domains.');
        req.flash('alertType', 'error');
        return res.redirect('/home');
    }
};
