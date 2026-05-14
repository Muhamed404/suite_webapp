const backend_api_urls = require("../../../config/backend_api_urls");
const { logger } = require("../../../logger/logger");
const getApiClient = require("../../../utility/api-client");
const { redactLogData } = require("../../../utility/redact");


async function getGroupsByOrganization(req, opts = {}) {
  try {
    const orgId = req?.user?.organization_id;
    if (!orgId) {
      const err = new Error('missing organization_id in session');
      logger.warn('[GroupService] missing orgId in session', redactLogData({ path: req?.originalUrl, user: req?.user?.userId }));
      return { data: { message: [] }, _err: err };
    }

    const url = backend_api_urls.PHISHMAGNUS.GROUPS.FIND_GROUP_BY_ORGANIZATION(orgId);
    const apiClient = getApiClient(req);

    logger.info(`[GroupService] fetching groups ${redactLogData(url)}`);

    const response = await apiClient.get(url);

    logger.info(`[GroupService] fetched total groups ${Array.isArray(response?.data?.message) ? response.data.message.length : 0}`);
    return response;
  } catch (error) {
    logger.error('[GroupService] error fetching groups', redactLogData({ error: error && (error.stack || error.message) }));
    return { data: { message: [] }, _err: error };
  }
}

module.exports = { getGroupsByOrganization };