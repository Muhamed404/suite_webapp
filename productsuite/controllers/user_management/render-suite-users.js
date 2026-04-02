const { logger } = require("../../../logger/logger");
const { hasAccess } = require("../../../utility/helperFunctions");
const ICONSTANTS = require("../../../contants/ICONSTANTS");
const enums = require('../../../contants/enum')
const getApiClient = require('../../../utility/api-client');
const render_ejs_urls = require("../../../config/render_ejs_urls");
const frontend_api_urls = require("../../../config/frontend_api_urls");
const backend_api_urls = require("../../../config/backend_api_urls");




exports.renderSuiteUsers = async (req, res) => {
  logger.info(`Controller - Render Suite Users: Incoming request.`);
  try {

    const organization = req.params.organizationId ? parseInt(req.params.organizationId) : parseInt(req.user.organization_id);

    let url = backend_api_urls.PRODUCT_SUITE.User_Management.LIST_SUITE_USERS(organization);

    const apiClient = getApiClient(req);
    const response = await apiClient.get(url);

    const data = response.data;
    const combinedUsers = [
      ...(data.object.mergedUsers || []),
      ...(data.object.UnlicensedUsers || [])
    ];

    logger.info(`Controller - Render Suite Users: Combined users count: ${combinedUsers.length}`);


    let hasCreatePermission = Boolean(false);
    let isReadOnly = Boolean(false);
    let userSession = req?.user;
    
    const isViewingDifferentOrg = req.params.organizationId && 
                                  parseInt(req.params.organizationId) !== parseInt(req.user.organization_id);
    
    logger.info(`[Organization User List] User org_id: ${req.user.organization_id}, Viewing org_id: ${req.params.organizationId}, isDifferentOrg: ${isViewingDifferentOrg}`);
    
    if (hasAccess(req, enums.ModuleNames.User_Management, [enums.Access_Types.RWD_ALL, enums.Access_Types.RWD_O]) && !isViewingDifferentOrg) {
      hasCreatePermission = Boolean(true);
      logger.info(`[Organization User List] Enabling Create Button for user: ` + userSession.email)
    }
    
    if (isViewingDifferentOrg) {
      isReadOnly = Boolean(true);
      logger.info(`[Organization User List] Setting read-only mode for user: ` + userSession.email + ` - viewing different organization`)
    }
    
    logger.info(`Controller - Render Suite Users: Rendering user list view with hasCreatePermission: ${hasCreatePermission}, isReadOnly: ${isReadOnly}`);
    return res.render(render_ejs_urls.ProductSuiteManagement.User_Management.LIST, {
      enableSuiteManagementLeftMenu: true,
      users: combinedUsers,
      hasCreatePermission,
      isReadOnly,
      locale: req.getLocale()
    });

  } catch (error) {
    logger.error(`Error - Controller - Render User List:: ${error}`);
    logger.error(error.stack)
    req.flash("message", "Unable to fetch user list");
    req.flash("alertType", "error");
    return res.redirect(frontend_api_urls.PRODUCT_SUITE.Home.INDEX);
  }
};

