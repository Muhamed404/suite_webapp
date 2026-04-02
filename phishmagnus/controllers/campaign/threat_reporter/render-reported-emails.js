const { logger } = require("../../../../logger/logger");
const getApiClient = require('../../../../utility/api-client');
const backend_api_urls = require("../../../../config/backend_api_urls");
const frontend_api_urls = require("../../../../config/frontend_api_urls");
const render_ejs_urls = require("../../../../config/render_ejs_urls");

exports.renderReportedEmails = async (req, res) => {


    try {
        logger.info(`[Reported Emails]: Incoming request`);

        if (!req.session || !req.user) {
            logger.warn(`[Reported Emails]: No active session - redirecting to login`);
            req.flash('message', 'Please log in to continue.');
            req.flash('alertType', 'error');
            return res.redirect(frontend_api_urls.LOGIN.PHISHMAGNUS);
        }

        const orgId = req.user.organization_id;
        const page     = parseInt(req.query.page)     || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;

        const apiClient = getApiClient(req);
        const response = await apiClient.get(
            backend_api_urls.PHISHMAGNUS.THREAT_REPORTER.LIST_BY_ORGANIZATION(orgId),
            { params: { page, pageSize }, headers: { Accept: 'application/json' } }
        );

        const backendData = response?.data?.data || {};
        const rows        = backendData.rows        || [];
        const count       = backendData.count       || 0;
        const totalPages  = backendData.totalPages  || 1;

        logger.info(`[Reported Emails]: Retrieved ${rows.length} reported email(s)`);

        return res.render(render_ejs_urls.PhishMagnus.Campaign.ReportedEmails.LIST, {
            reportedEmails: rows,
            pagination: { currentPage: page, pageSize, totalPages, count },
            user: req.user,
            locale: req.getLocale ? req.getLocale() : 'en',
        });

    } catch (error) {
        logger.error(`[Reported Emails]: Error: ${error.message}`);
        req.flash('message', 'Failed to load reported emails.');
        req.flash('alertType', 'error');
        return res.redirect(frontend_api_urls.LOGIN.PHISHMAGNUS);
    }
};
