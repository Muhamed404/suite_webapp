

const backend_api_urls = require("../config/backend_api_urls");
const { logger } = require("../logger/logger");

const getApiClient = require('../utility/api-client')


async function getFilteredRolesByOrganizationLevel(req, orgId = 0) {
  const url = backend_api_urls.PRODUCT_SUITE.User_Roles.User_Role_By_Organization(orgId);
  try {
    const apiClient = getApiClient(req);

    const response = await apiClient.get(url);

    const roles = response.data?.roles || null;
    logger.info(`[Commong Fetch Roles] ${roles ? 'Roles fetched successfully' : 'No roles found'}`);
    logger.info(`[Commong Fetch Roles] Roles length: ${roles ? roles.length : 0}`);
    return roles;

  } catch (error) {
    logger.error(`Issue in fetching roles` + error);
    logger.error(error.stack);
    logger.error(error.message);
    throw new Error('Issue in fetching roles');
  }
}



module.exports = {
  getFilteredRolesByOrganizationLevel,

};
