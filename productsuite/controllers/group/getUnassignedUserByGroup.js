 
const backend_api_urls = require("../../../config/backend_api_urls");
const { logger } = require("../../../logger/logger");

const getApiClient = require("../../../utility/api-client");

async function getUnassignedUserByGroup(req, res) {
  try {
    logger.info("Incoming request to get unassigned users by group");
    const organization = parseInt(req?.user.organization_id) || null;
    if (!organization) {
      logger.error("Invalid user organization");
      return res.status(400).json({ success: false, message: "Invalid request" });
    }
    const url = backend_api_urls.PHISHMAGNUS.GROUPS.UNASSIGNED_USERS_BY_GROUP;
    logger.info('Printing url for unassigned users by group: ' + url);
    const apiClient = getApiClient(req);
    const response = await apiClient.get(url)

    const users = response.data?.users || [];
    logger.info('Printing unassigned users by group: ' + JSON.stringify(users, null, 2));
    return res.status(200).json({ success: true, unassignedUsers: users });

  } catch (error) {
    logger.error("Printing error in getUnassignedUserByGroup: " + error);
    res.status(500).json({ success: false, message: "Error fetching unassigned users by group" });
  }
}


module.exports = {
  getUnassignedUserByGroup
}