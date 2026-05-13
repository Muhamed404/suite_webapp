
const backend_api_urls = require("../../../config/backend_api_urls");
const frontend_api_urls = require("../../../config/frontend_api_urls");
const { logger } = require("../../../logger/logger");
const getApiClient = require("../../../utility/api-client");
const { redactLogData } = require("../../../utility/redact");


async function enrolToGroup(req, res) {
    try {
        logger.info("Incoming request to enrolToGroup");
        const { selectedUsers } = req.body;
        // console.log('############3 ' + JSON.stringify(selectedUsers))
        const groupId = req.params?.groupId || null;
        const hasRequestedToUnenroll = req.params?.hasRequestedToUnenroll || false;
        logger.info("Incoming request to enrolToGroup: GROUP ID " + groupId);
        logger.info("Incoming request to enrolToGroup: SELECTED USERS " + JSON.stringify(redactLogData(selectedUsers), null, 2));
        logger.info("Incoming request to enrolToGroup: HAS REQUESTED TO hasRequestedToUnenroll " + hasRequestedToUnenroll);
        if (!groupId) {
            logger.error("Incoming request to enrolToGroup: MISSING GROUP ID");
            req.flash('alertType', 'error');
            req.flash('message', 'MISSING GROUP ID');
            return res.redirect(frontend_api_urls.PHISHMAGNUS.Group.List);
        }
        const url = backend_api_urls.PHISHMAGNUS.GROUPS.EnrolUserToGroup(groupId, hasRequestedToUnenroll);
        logger.info('Printing backend api url in enrolToGroup ' + redactLogData(url));
        const apiClient = getApiClient(req);
        const response = await apiClient.post(url, { selectedUsers })

        const message = response.data?.message || 'Error in assigning users to group'
        logger.info('Incoming request to enrolToGroup: POST ENROL TO GROUP ' + JSON.stringify(redactLogData(response.data), null, 2));
        return res.status(200).json({ success: true, unassignedUsers: message });

    } catch (error) {
        logger.error("Incoming request to enrolToGroup: " + redactLogData(error.stack));
        req.flash('alertType', 'error');
        req.flash('message', 'Error in assigning users to group');
        // return res.redirect(frontend_api_urls.PHISHMAGNUS.Group.List);
    }
}

module.exports = {
    enrolToGroup
}