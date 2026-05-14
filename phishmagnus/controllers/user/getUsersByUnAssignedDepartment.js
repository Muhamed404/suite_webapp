
const backend_api_urls = require("../../../config/backend_api_urls");
const { logger } = require("../../../logger/logger");

const getApiClient = require("../../../utility/api-client");
const { redactLogData } = require("../../../utility/redact");

async function getUsersByUnAssignedDepartment(req, res) {
  try {
    logger.info("Incoming request to get unassigned department users");
    const organization = req.params.organizationId ? parseInt(req.params.organizationId) : parseInt(req.user.organization_id);

    if (!organization) {
      logger.error("Invalid user organization");
      return res.status(400).json({ success: false, message: "Invalid request" });
    }
    const url = backend_api_urls.PHISHMAGNUS.DEPARTMENT.UNASSIGNED_USERS_BY_ORGANIZATION(organization);
    logger.info('Printing url for unassigned department users: ' + url);
    const apiClient = getApiClient(req);
    const response = await apiClient.get(url)

    const users = response.data?.users || [];
    logger.info('Printing unassigned department users: ' + JSON.stringify(redactLogData(users), null, 2));
    return res.status(200).json({ success: true, unassignedUsers: users });

  } catch (error) {
    logger.error("Printing error in getUsersByUnAssignedDepartment: " + error);
    res.status(500).json({ success: false, message: "Error fetching unassigned department users" });
  }
}


module.exports = {
  getUsersByUnAssignedDepartment
}