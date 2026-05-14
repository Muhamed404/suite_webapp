const config = require("../../../config/env.config");

const { logger } = require("../../../logger/logger");
const enums = require("../../../contants/enum");

const getApiClient = require('../../../utility/api-client')
const backend_api_urls = require('../../../config/backend_api_urls');
const frontend_api_urls = require("../../../config/frontend_api_urls");
const render_ejs_urls = require("../../../config/render_ejs_urls");
const { redactLogData } = require("../../utility/redact");
exports.fetchDepartment = async (req, res) => {
  logger.info(`Controller - Retrieving departments for organization ${req.user.organization_id}`);



  if (req.method === "GET") {
    logger.info('INCOMING RQUEST IN FETCH DEPARTMENT')
    let orgId = req.user.organization_id === null ? req.params.organizationId : req.user.organization_id;

    const url = backend_api_urls.PHISHMAGNUS.DEPARTMENT.Find_Department_By_Organization(orgId);

    let subscriptionUrl = backend_api_urls.PRODUCT_SUITE.Subscription.Find_Balance_By_Organization(orgId);
    const apiClient = getApiClient(req);
    return Promise.all([apiClient.get(url), apiClient.get(subscriptionUrl)])
      .then(([response, subscriptionResponse]) => {
        const departments = response.data?.message || [];
        logger.info('Department list ' + JSON.stringify(redactLogData(departments), null, 2))
        let subscription = subscriptionResponse.data?.message || [];
        logger.info(`[Department GET] Retrieved ${departments.length} departments for organization ${orgId}`);
        logger.info(`[Department GET] Departments Data: ${JSON.stringify(redactLogData(departments), null, 2)}`);
        logger.info(`[Department GET] Rendering view department form`);
        const actionType = "department";
        let disableEmailDataTableIndex = false;
        let allowActions = false;
        // below for enabling the editting rows on the view
        // if (isMagAdmin(userSession.id) || ICONSTANTS.OrgSuperAdmin == userSession.id || ICONSTANTS.OrgSubAdmin == userSession.id) {
        disableEmailDataTableIndex = true;
        allowActions = true
        // }
        res.render(render_ejs_urls.PhishMagnus.Department.RENDER_DEPARTMENT_VIEW, {
          enableSuiteManagementLeftMenu: true,
          message: req.query.message,
          alertType: req.query.alertType,
          departments,
          actionType,
          organization: orgId,
          organizationName: req.query?.On || '',
          subscription,
          disableEmailDataTableIndex,
          allowActions,
          user: req.user,
          isSecureMagnusAdmin: req.user?.organization_id === null
        });
      })
      .catch((error) => {
        logger.error(`${error.message}`);
        logger.error(`Error in fetching department list: ${error.stack}`);
        req.flash("message", "Error in fetching department list");
        req.flash("alertType", "error");
        res.redirect("/home");
      });
  } else {
    logger.error(`invalid url in department findallbyorganization`);
  }
};

