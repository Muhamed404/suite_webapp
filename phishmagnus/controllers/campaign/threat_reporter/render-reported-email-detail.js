const { logger } = require("../../../../logger/logger");
const getApiClient = require('../../../../utility/api-client');
const backend_api_urls = require("../../../../config/backend_api_urls");
const frontend_api_urls = require("../../../../config/frontend_api_urls");
const render_ejs_urls = require("../../../../config/render_ejs_urls");

exports.renderReportedEmailDetail = async (req, res) => {
    try {
        const { reportId } = req.params;

        logger.info(`[Reported Email Detail]: Incoming request for reportId=${reportId}`);

        if (!req.session || !req.user) {
            logger.warn(`[Reported Email Detail]: No active session - redirecting to login`);
            req.flash('message', 'Please log in to continue.');
            req.flash('alertType', 'error');
            return res.redirect(frontend_api_urls.LOGIN.PHISHMAGNUS);
        }

        const apiClient = getApiClient(req);
        const response = await apiClient.get(
            backend_api_urls.PHISHMAGNUS.THREAT_REPORTER.REPORT_DETAIL(reportId),
            { headers: { Accept: 'application/json' } }
        );

        const report = response?.data?.data || null;

        if (!report) {
            logger.warn(`[Reported Email Detail]: No data returned for reportId=${reportId}`);
            req.flash('message', 'Reported email not found.');
            req.flash('alertType', 'error');
            return res.redirect('/phm/reported-emails/list');
        }

        // Parse raw_email_header JSON safely
        let emailHeaders = {};
        try {
            emailHeaders = report.raw_email_header ? JSON.parse(report.raw_email_header) : {};
        } catch (_) {
            emailHeaders = {};
        }

        // Determine if this is a real phishing email or a PhishMagnus simulated one.
        // Simulated emails have x_magnus_inv and x_magnus_test set to non-null values.
        const isSimulated = emailHeaders.x_magnus_inv != null || emailHeaders.x_magnus_test != null;
        report.real_phishing_email = !isSimulated;

        logger.info(`[Reported Email Detail]: Retrieved report id=${report.id}, real_phishing_email=${report.real_phishing_email}`);

        return res.render(render_ejs_urls.PhishMagnus.Campaign.ReportedEmails.DETAIL, {
            report,
            emailHeaders,
            user: req.user,
            locale: req.getLocale ? req.getLocale() : 'en',
        });

    } catch (error) {
        logger.error(`[Reported Email Detail]: Error: ${error.message}`);
        req.flash('message', 'Failed to load reported email details.');
        req.flash('alertType', 'error');
        return res.redirect('/phm/reported-emails/list');
    }
};
