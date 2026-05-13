const { logger } = require("../../../../logger/logger");
const getApiClient = require('../../../../utility/api-client');
const backend_api_urls = require("../../../../config/backend_api_urls");
const frontend_api_urls = require("../../../../config/frontend_api_urls");
const { redactLogData } = require("../../../utility/redact");

exports.downloadReportByInvitee = async (req, res) => {
    try {
        const { inviteeId } = req.params;

        logger.info(`[Download Report By Invitee]: Incoming request for inviteeId=${redactLogData(inviteeId)}`);

        if (!req.session || !req.user) {
            logger.warn(`[Download Report By Invitee]: No active session - redirecting to login`);
            req.flash('message', 'Please log in to continue.');
            req.flash('alertType', 'error');
            return res.redirect(frontend_api_urls.LOGIN.PHISHMAGNUS);
        }

        const apiClient = getApiClient(req);
        const response = await apiClient.get(
            backend_api_urls.PHISHMAGNUS.THREAT_REPORTER.DOWNLOAD_BY_INVITEE(inviteeId),
            { headers: { Accept: 'application/json' } }
        );

        const data = response?.data?.data || response?.data || null;
        const success = response?.data?.success || false;

        if (!data || !success) {
            logger.warn(`[Download Report By Invitee]: No data returned for inviteeId=${inviteeId}`);
            req.flash('message', 'No report data found for this invitee.');
            req.flash('alertType', 'error');
            return res.redirect(frontend_api_urls.PHISHMAGNUS.Campaign.EMAIL.REPORT);
        }

        const extracted = {
            reported_time:        data.reported_time        ?? null,
            user_email:           data.user_email           ?? null,
            email_subject:        data.email_subject        ?? null,
            magnus_email_header:  data.magnus_email_header  ?? null,
            raw_email_header:     data.raw_email_header     ?? null,
        };

        const json = JSON.stringify(extracted, null, 2);
        const filename = `threat-report-invitee-${extracted.user_email}.json`;

        logger.info(`[Download Report By Invitee]: Sending file ${redactLogData(filename)}`);

        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/json');
        return res.send(json);

    } catch (error) {
        logger.error(`[Download Report By Invitee]: Error: ${error.message}`);
        req.flash('message', 'Failed to download report.');
        req.flash('alertType', 'error');
        return res.redirect(frontend_api_urls.PHISHMAGNUS.Campaign.EMAIL.REPORT);
    }
};
