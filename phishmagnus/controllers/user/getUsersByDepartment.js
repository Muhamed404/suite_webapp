

const backend_api_urls = require("../../../config/backend_api_urls");
const { logger } = require("../../../logger/logger");

const getApiClient = require("../../../utility/api-client");


async function getUsersByDepartment(req, res) {
  try {
    logger.info("Incoming request for getUsersByDepartment with params: " + JSON.stringify(req.params, null, 2));
    const deptId = parseInt(req.params.departmentId);
    const organization = req.params.organizationId ? parseInt(req.params.organizationId) : parseInt(req.user.organization_id);
    const url = backend_api_urls.PHISHMAGNUS.DEPARTMENT.ASSIGNED_USERS_BY_DEPARTMENT(organization, deptId);
    const apiClient = getApiClient(req);
    const response = await apiClient.get(url)

    const users = response.data?.users || [];
    if (users.length === 0) {
      logger.info('No assigned users found for department ' + deptId + ' and organization ' + organization);
      return res.status(200).json({ success: true, assignedUsers: [] });
    }
    logger.info('Printing assigned users for department ' + deptId + ' and organization ' + organization + ': ' + JSON.stringify(users, null, 2));
    return res.status(200).json({ success: true, assignedUsers: users });

  } catch (error) {
    logger.error("Exception in assign users by department: " + error.stack);
    req.flash("message", "Error fetching users for department");
    req.flash('alertType', 'error');
    res.status(500).json({ success: false, message: "Error fetching users" });
  }
}

module.exports = {
  getUsersByDepartment
}