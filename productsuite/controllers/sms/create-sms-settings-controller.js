
const backend_api_urls = require("../../../config/backend_api_urls");
const { logger } = require("../../../logger/logger");
const apiClient = require("../../../utility/api-client");

exports.createSMSSettings = async (req, res) => {
    const organizationId = !req.user.organizationId ? req.params.organizationId : req.user.organizationId;

    try {
        logger.info(`Controller - Create SMS Settings: Create SMS Settings called`);
        const apiClientInstance = apiClient(req);
        const url = backend_api_urls.PRODUCT_SUITE.SMS.CREATE(organizationId);
        logger.info(`Controller - SMS Settings: Posting URL: ${url}`);
        logger.info(`Controller - SMS Settings: Payload: ${JSON.stringify(req.body, null, 2)}`);
        const response = await apiClientInstance.post(url, req.body);
        if (response.data.success) {
            logger.info(`Controller - SMS Settings: Successfully created SMS for organization ID ${organizationId}`);
            req.flash("message", req.__("sms.settings.create_success"));
            req.flash("alertType", "success");
            return res.redirect(`/organization/profile/${organizationId}`);

        }

        logger.error(`Create SMS Controller: Failed to create SMS for organization ID ${organizationId} - ${response.message}`);
        req.flash("message", req.__("sms.settings.create_failed"));
        req.flash("alertType", "error");
        return res.redirect(`/sms/settings/${organizationId}`);
    } catch (err) {
        req.flash("message", req.__("sms.settings.create_failed"));
        req.flash("alertType", "error");
        logger.error(`Create SMS Controller: Error creating SMS for organization ID ${organizationId} - ${err.message}`);
        logger.error(err.stack);
        return res.redirect(`/sms/settings/${organizationId}`);

    }
};