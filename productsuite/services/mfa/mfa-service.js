const { logger } = require("../../../logger/logger");
const getApiClient = require("../../../utility/api-client");
const { redactLogData } = require("../../../utility/redact");


const retrieveMFAConfiguration = async (req) => {
    try {
        logger.info(`[MFA Configuration Retrieval]: Incoming request`);

        const apiClient = getApiClient(req);
        const url = `/mfa/config`;

        const response = await apiClient.get(url); // await the promise

        // Optional: Log response structure for clarity
        logger.info(`[MFA Configuration Retrieval]: Raw response: ${JSON.stringify(redactLogData(response.data))}`);

        // Access based on your APIResponse structure
        const mfaSMTP = response?.data?.object;

        logger.info(`[MFA Configuration Retrieval]: Sending response to controller`);
        return mfaSMTP;

    } catch (error) {
        logger.error(`[MFA Configuration Retrieval]: Issue in retrieving mfa smtp: ${redactLogData(error.message)}`);
        throw error;
    }
};


const create = async (req, smtpName, smtpData, enable_mfa, is_encrypted) => {
    try {
        logger.info(`[Save MFA Configuration]: Incoming request`);

        const apiClient = getApiClient(req);
        const url = `/mfa/create`;
        const payload = {
            name: smtpName,
            smtp_data: smtpData,
            enable_mfa,
            is_encrypted
        }
        await apiClient.post(url, payload);

    } catch (error) {
        logger.error(`[Save MFA Configuration]: Issue in saving mfa smtp: ${redactLogData(error.message)}`);
        throw error;
    }
};


module.exports = { retrieveMFAConfiguration, create }