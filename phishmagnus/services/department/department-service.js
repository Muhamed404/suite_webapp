const backend_api_urls = require("../../../config/backend_api_urls");
const { logger } = require("../../../logger/logger");
const getApiClient = require("../../../utility/api-client");



async function getDepartmentsByOrganization(req) {
    try {
        const orgId = req.user.organization_id;
        let url = backend_api_urls.PHISHMAGNUS.DEPARTMENT.Find_Department_By_Organization(orgId);
        const apiClient = getApiClient(req);

        const response = await apiClient.get(url);
        return response;
    } catch (error) {
        logger.error(
            `Issue in fetching department list by organization: `,
            error.message
        );
        logger.error(error.stack);
        return null;
    }
}


module.exports = { getDepartmentsByOrganization }