const backend_api_urls = require("../../../config/backend_api_urls");
const { logger } = require("../../../logger/logger");
const getApiClient = require("../../../utility/api-client");
const { redactLogData } = require("../../../utility/redact");

async function sendBulkUserInvite(req, res) {
    try {
        const { user_ids, send_credentials = false, reset_password = false, invitation = false } = req.body || {};

        const normalizedUserIds = Array.isArray(user_ids)
            ? user_ids.map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0)
            : [];

        if (normalizedUserIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Please select at least one user.",
            });
        }

        const payload = {
            user_ids: normalizedUserIds,
            send_credentials: Boolean(send_credentials),
            reset_password: Boolean(reset_password),
            invitation: Boolean(invitation),
        };

        const apiClient = getApiClient(req);
        const apiResponse = await apiClient.post(
            backend_api_urls.PRODUCT_SUITE.User_Management.BULK_INVITE_SEND,
            payload
        );

        const responseData = apiResponse?.data || {};
        return res.status(200).json({
            success: responseData.success !== false,
            message: responseData.message || "Bulk invite request submitted.",
            data: responseData.data || null,
        });
    } catch (error) {
        const backendMessage =
            error?.response?.data?.message ||
            error?.response?.data?.error ||
            error.message ||
            "Failed to submit bulk invite request.";

        logger.error(`Controller - [SendBulkUserInvite]: ${redactLogData(backendMessage)}`);
        logger.error(redactLogData(error.stack));

        return res.status(500).json({
            success: false,
            message: backendMessage,
        });
    }
}

module.exports = {
    sendBulkUserInvite,
};
