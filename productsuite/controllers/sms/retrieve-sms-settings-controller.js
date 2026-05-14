
const { logger } = require("../../../logger/logger");
const apiClient = require("../../../utility/api-client");
const frontend_api_urls = require("../../../config/frontend_api_urls");
const { redactLogData } = require("../../../phishmagnus/utility/redact");
exports.retrieveSMSSettings = async (req, res) => {
    logger.info(`Controller - Retrieveing SMS Settings: Incoming request to retrieve SMS with ID ${req.params.organizationId}`);
    const organizationId = !req.user.organizationId ? req.params.organizationId : req.user.organizationId;
    try {
        if (!organizationId) {
            logger.warn(`Retrieve SMS Controller: No organization ID provided in request params or user context.`);
            req.flash("message", "Organization is required to retrieve SMS settings.");
            req.flash("alertType", "error");
            return res.redirect(frontend_api_urls.PHISHMAGNUS.Home);
        }

        const apiClientInstance = apiClient(req);
        const response = await apiClientInstance.get(`/sms/settings/${organizationId}`);
        logger.info(`Retrieve SMS Controller: Successfully retrieved SMS with ID ${organizationId}`);
        const smsData = response.data.object || null;
        logger.info(`Retrieve SMS Controller: SMS Data: ${JSON.stringify(redactLogData(smsData), null, 2)}`);
        return res.render("pages/sms/create-sms", { sms: smsData, organization: req.params.organizationId, enableSuiteManagementLeftMenu: true });


    } catch (err) {
        logger.error(`Retrieve SMS Controller: Error retrieving SMS with ID ${organizationId} - ${err.message}`);
        if (req.session) {
            req.flash("message", "Failed to retrieve SMS.");
            req.flash("alertType", "error");
        }
        return res.redirect(`/organization/profile/${organizationId}`);
    }
};