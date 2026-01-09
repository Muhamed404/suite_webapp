const backend_api_urls = require("../../../config/backend_api_urls");
const { logger } = require("../../../logger/logger");
const getApiClient = require("../../../utility/api-client");


async function  listTemplatesByOrgAndType(orgId, phishingCampaignType, req) {
    try {

        let url = backend_api_urls.PRODUCT_SUITE.Template.TEMPLATES_BY_CAMPAIGN_TYPE(orgId, phishingCampaignType);
        const apiClient = getApiClient(req);
        logger.info('@@@@@@ listTemplatesByOrgAndType ' + url);
        const response = await apiClient.get(url);
        return response;
    } catch (error) {
        logger.error(
            `Issue in fetching templates list by organization: `,
            error.message
        );
        logger.error(error.stack);
        return null;
    }
}
async function getSystemTemplates(phishingCampaignType, req) {
    try {
        const url = backend_api_urls.PRODUCT_SUITE.Template.SYSTEM_TEMPLATES_BY_CAMPAIGN_TYPE(phishingCampaignType);
        logger.info(`Fetching system templates for campaignType=${phishingCampaignType} from ${url}`);

        const apiClient = getApiClient(req);
        const response = await apiClient.get(url);

        logger.info(`System templates request completed with status=${response?.status ?? 'unknown'}`);
        // Log response summary (avoid dumping sensitive full payload)
        if (response && response.data) {
            const templates = response.data.templates ?? null;
            if (templates) {
                if (Array.isArray(templates)) {
                    logger.info(`Retrieved ${templates.length} system templates for campaignType=${phishingCampaignType}`);
                } else {
                    logger.info(`Retrieved system templates (non-array) type=${typeof templates} for campaignType=${phishingCampaignType}`);
                }
                logger.info(`System templates sample (first item): ${JSON.stringify(Array.isArray(templates) ? templates[0] : templates)}`);
                return templates;
            }
            logger.info('Response contained no templates property');
            return null;
        }
        logger.warn('No response or response.data when fetching system templates');
        return null;
    } catch (error) {
        logger.error(`Issue in fetching system templates: `, error.message);
        // If using axios-like client, include response details if available
        if (error.response) {
            logger.error(`Upstream response status=${error.response.status} data=${JSON.stringify(error.response.data)}`);
        }
        logger.error(error.stack);
        return null;
    }
}

module.exports = { getSystemTemplates, listTemplatesByOrgAndType }