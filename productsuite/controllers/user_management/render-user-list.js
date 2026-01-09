const { logger } = require("../../../logger/logger");
const {  hasAccess } = require("../../../utility/helperFunctions");
const ICONSTANTS = require("../../../contants/ICONSTANTS");
const enums = require('../../../contants/enum')
const getApiClient = require('../../../utility/api-client');
const render_ejs_urls = require("../../../config/render_ejs_urls");
const frontend_api_urls = require("../../../config/frontend_api_urls");




exports.renderUserList = async (req, res) => {
  logger.info(`Controller - Render User List: Incoming request.`);
  try {
    let userSession = req?.user;
    let orgId = req.params?.organization || userSession.organization_id
    orgId = orgId === null ? 0 : orgId // setting default value to zero if not organization
    logger.info(`[Organization User List] Users list for Organization ${orgId}`);
    logger.info(`[Organization User List] user loggedIn session email ${userSession.email}`)
    let url = `/user/organization/list/${orgId}`;
    // let subscriptionUrl = `/subscription/findAllByOrg/${orgId}`
    const apiClient = getApiClient(req);
    // let subscriptionResponse = null;
    let response = null;
    if (orgId !== 0) {
      // [subscriptionResponse, response] = await Promise.all([apiClient.get(subscriptionUrl), apiClient.get(url)])
      [response] = await Promise.all([apiClient.get(url)])


    } else {
      [response] = await Promise.all([apiClient.get(url)])

    }
    const organizationUsers = response.data.message;
    logger.info(`[Organization User List]: Printing Response ${organizationUsers.length}`)
    // let subscription = subscriptionResponse !== null ? subscriptionResponse.data.message[0] : null;
    // logger.info(`[[Organization User List]: Printing subscription Response ${JSON.stringify(subscription)}`)

    const actionType = "user";
    let disableEmailDataTableIndex = false;

    disableEmailDataTableIndex = true;
    let hasCreatePermission = Boolean(true);

    if (!hasAccess(req, enums.ModuleNames.User_Management, [enums.Access_Types.RWD_ALL, enums.Access_Types.RWD_O])) {
      logger.info(`[Organization User List] Disabling Create Button for user: ` + userSession.email)

      hasCreatePermission = Boolean(false)
    }
    logger.info(logger.info(`[Organization User List] Total Fetch list of users ${organizationUsers.length} `))
    logger.info(logger.info(`[Organization User List] Users ${JSON.stringify(organizationUsers)} `))
    if (organizationUsers) {
      let organization = null;
      if (orgId !== null) {
        organization = {
          id: organizationUsers.id,
          name: organizationUsers.name,

        }
      } else {
        organization = orgId
      }
      return res.render(render_ejs_urls.ProductSuiteManagement.User_Management.LIST, {
        enableSuiteManagementLeftMenu: true,
        user: orgId !== 0 ? organizationUsers.UserProfile : organizationUsers,
        hasCreatePermission,
        actionType,
        organization: organization,
        // subscription,
        disableEmailDataTableIndex,
      });
    } else {
      res.render("pages/product_suite_management/suite_management", {
        message: organizationUsers.message,
        alertType: "info",
      });
    }

  } catch (error) {
    logger.error(`Error - Controller - Render User List:: ${error}`);
    logger.error(error.stack)
    req.flash("message", "Unable to fetch user list");
    req.flash("alertType", "error");
    return res.redirect(frontend_api_urls.PRODUCT_SUITE.Home.INDEX);
  }
};
