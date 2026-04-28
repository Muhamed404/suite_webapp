const backend_api_urls = require("../../../config/backend_api_urls");
const { logger } = require("../../../logger/logger");
const apiClient = require("../../../utility/api-client");

exports.updateSMSSettings = async (req, res) => {
    const organizationId = !req.user.organizationId ? req.params.organizationId : req.user.organizationId;

    try {
        logger.info(`Update SMS Controller: Incoming request to update SMS for Organization ID ${organizationId}`);

        const {
            provider_name,
            base_url,
            api_key,
            sender_id,
            from_number,
            account_sid,
            auth_token,
            is_active
        } = req.body;

        if (!provider_name) {
            req.flash("message", req.__("sms.settings.update_failed"));
            req.flash("alertType", "error");
            return res.redirect(`/sms/settings/${organizationId}`);
        }

        let finalPayload = {};
        switch (provider_name) {
            case "infobip":
                finalPayload = {
                    base_url,
                    api_key,
                    sender_id
                };
                break;
            case "twilio":
                finalPayload = {
                    account_sid,
                    auth_token,
                    sender_id: sender_id || from_number
                };
                break;
            case "unifonic":
                finalPayload = {
                    base_url,
                    api_key,
                    sender_id
                };
                break;
            default:
                req.flash("message", req.__("sms.settings.update_failed"));
                req.flash("alertType", "error");
                return res.redirect(`/sms/settings/${organizationId}`);
        }

        const apiClientInstance = apiClient(req);
        const url = backend_api_urls.PRODUCT_SUITE.SMS.UPDATE(organizationId);
        const response = await apiClientInstance.put(url, {
            provider: provider_name,
            config: finalPayload,
            is_active: is_active === "true" || is_active === true
        });

        if (response?.data?.success) {
            logger.info(`Update SMS Controller: Successfully updated SMS for Organization ID ${organizationId}`);
            req.flash("message", req.__("sms.settings.update_success"));
            req.flash("alertType", "success");
            return res.redirect(`/organization/profile/${organizationId}`);
        }

        logger.error(`Update SMS Controller: Failed to update SMS for Organization ID ${organizationId}`);
        req.flash("message", req.__("sms.settings.update_failed"));
        req.flash("alertType", "error");
        return res.redirect(`/sms/settings/${organizationId}`);
    } catch (err) {
        logger.error(`Update SMS Controller: Error updating SMS for Organization ID ${organizationId} - ${err.message}`);
        logger.error(err.stack);
        req.flash("message", req.__("sms.settings.update_failed"));
        req.flash("alertType", "error");
        return res.redirect(`/sms/settings/${organizationId}`);
    }
};