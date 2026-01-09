
const { logger } = require("../../../logger/logger");
const apiClient = require("../../../utility/api-client");

exports.updateSMSSettings = async (req, res) => {
    try {
        logger.info(`Update SMS Controller: Incoming request to update SMS with ID ${req.params.id}`);
        const apiClientInstance = apiClient(req);
        const response = await apiClientInstance.put(`/sms/${req.params.id}`, req.body);
        if (response.success) {
            logger.info(`Update SMS Controller: Successfully updated SMS with ID ${req.params.id}`);
            req.flash("message", "SMS updated successfully.");
            req.flash("alertType", "success");
            return res.redirect(`/organization/sms/${req.params.id}`);

        } else {
            logger.error(`Update SMS Controller: Failed to update SMS with ID ${req.params.id} - ${response.message}`);
            req.flash("message", "SMS updated successfully.");
            req.flash("alertType", "success");
            return res.redirect(`/organization/sms/${req.params.id}`);
        }
    } catch (err) {
        logger.error(`Update SMS Controller: Error updating SMS with ID ${req.params.id} - ${err.message}`);
        req.flash("message", "Failed to update SMS.");
        req.flash("alertType", "error");
        return res.redirect(`/organization/sms/${req.params.id}`);
    }
};