

const backend_api_urls = require("../../../config/backend_api_urls");
const render_ejs_urls = require("../../../config/render_ejs_urls");
const { logger } = require("../../../logger/logger");
const getApiClient = require('../../../utility/api-client')
const enums = require("../../../contants/enum");
const frontend_api_urls = require("../../../config/frontend_api_urls");
const { redactLogData } = require("../../../utility/redact");


exports.getUsersByGroup = async (req, res) => { 
  try {
    logger.info("Incoming request for getUsersByGroup with params: " + JSON.stringify(redactLogData(req.params), null, 2));
    const groupId = parseInt(req.params.groupId);
    const organization = parseInt(req.user.organization_id);
    const url = backend_api_urls.PHISHMAGNUS.GROUPS.ASSIGNED_USERS_BY_GROUP(groupId);
    const apiClient = getApiClient(req);
    const response = await apiClient.get(url)

    const users = response.data?.users || [];
    if (users.length === 0) {
      logger.info('No assigned users found for group ' + groupId + ' and organization ' + organization);
      return res.status(200).json({ success: true, assignedUsers: [] });
    }
    logger.info('Printing assigned users for group ' + groupId + ' and organization ' + organization + ': ' + JSON.stringify(redactLogData(users), null, 2));
    return res.status(200).json({ success: true, assignedUsers: users });

  } catch (error) {
    logger.error("Exception in assign users by group: " + redactLogData(error.stack));
    req.flash("message", "Error fetching users for group ");
    req.flash('alertType', 'error');
    // res.status(500).json({ success: false, message: "Error fetching users" });
  }
}