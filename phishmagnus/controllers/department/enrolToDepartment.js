
const backend_api_urls = require("../../../config/backend_api_urls");
const frontend_api_urls = require("../../../config/frontend_api_urls");
const { logger } = require("../../../logger/logger");
const getApiClient = require("../../../utility/api-client");


async function enrolToDepartment(req, res) {
    try {
        logger.info("Incoming request to enrolToDepartment");
        const { selectedUsers } = req.body;
        // console.log('############3 ' + JSON.stringify(selectedUsers))
        const departmentId = req.params?.departmentId || null;
        const hasRequestedToUnenroll = req.params?.hasRequestedToUnenroll || false;
        logger.info("Incoming request to enrolToDepartment: DEPARTMENT ID " + departmentId);
        logger.info("Incoming request to enrolToDepartment: SELECTED USERS " + JSON.stringify(selectedUsers, null, 2));
        logger.info("Incoming request to enrolToDepartment: HAS REQUESTED TO hasRequestedToUnenroll " + hasRequestedToUnenroll);
        if (!departmentId) {
            logger.error("Incoming request to enrolToDepartment: MISSING DEPARTMENT ID");
            req.flash('alertType', 'error');
            req.flash('message', 'MISSING DEPARTMENT ID');
            return res.redirect(frontend_api_urls.PHISHMAGNUS.Department.List);
        }
        const url = backend_api_urls.PHISHMAGNUS.DEPARTMENT.EnrolUserToDepartment(departmentId, hasRequestedToUnenroll);
        logger.info('Printing backend api url in enrolToDepartment ' + url);
        const apiClient = getApiClient(req);
        const response = await apiClient.post(url, { selectedUsers })

        const message = response.data?.message || 'Error in assigning users to department'
        logger.info('Incoming request to enrolToDepartment: POST ENROL TO DEPARTMENT ' + JSON.stringify(response.data, null, 2));
        return res.status(200).json({ success: true, unassignedUsers: message });

    } catch (error) {
        logger.error("Incoming request to enrolToDepartment: " + error.stack);
        req.flash('alertType', 'error');
        req.flash('message', 'Error in assigning users to department');
        return res.redirect(frontend_api_urls.PHISHMAGNUS.Department.List);
    }
}

module.exports = {
    enrolToDepartment
}