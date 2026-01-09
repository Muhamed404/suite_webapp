const { logger } = require("../../../logger/logger");
const getApiClient = require("../../../utility/api-client");


const retrieveMFAConfiguration = async (req) => {
    try {
        logger.info(`[MFA Configuration Retrieval]: Incoming request`);

        const apiClient = getApiClient(req);
        const url = `/mfa/settings`;

        const response = await apiClient.get(url); // await the promise

        // Optional: Log response structure for clarity
        logger.info(`[MFA Configuration Retrieval]: Raw response: ${JSON.stringify(response.data)}`);

        // Access based on your APIResponse structure
        const mfaSMTP = response?.data?.object;

        logger.info(`[MFA Configuration Retrieval]: Sending response to controller`);
        return mfaSMTP;

    } catch (error) {
        logger.error(`[MFA Configuration Retrieval]: Issue in retrieving mfa smtp: ${error.message}`);
        throw error;
    }
};


const create = async (req, smtpName, smtpData, enable_mfa) => {
    try {
        logger.info(`[Save MFA Configuration Retrieval]: Incoming request`);

        const apiClient = getApiClient(req);
        const url = `/mfa/create`;
        const payload = {
            name: smtpName,
            smtp_data: smtpData,
            enable_mfa
        }
        await apiClient.post(url, payload); // await the promise

    } catch (error) {
        logger.error(`[MFA Configuration Retrieval]: Issue in saving mfa smtp: ${error.message}`);
        throw error;
    }
};


module.exports = { retrieveMFAConfiguration, create }