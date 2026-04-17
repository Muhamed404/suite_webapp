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

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(100, Math.max(5, parseInt(req.query.pageSize, 10) || 25));
    const search = (req.query.search || req.query.q || "").trim();

    const apiClient = getApiClient(req);
    const response = await apiClient.get(url, {
      params: { page, pageSize, search },
    });

    const data = response.data;
    const obj = data.object || {};
    const combinedUsers = Array.isArray(obj.users)
      ? obj.users
      : [...(obj.mergedUsers || []), ...(obj.UnlicensedUsers || [])];

    const suitePagination = {
      page: obj.page != null ? obj.page : page,
      pageSize: obj.pageSize != null ? obj.pageSize : pageSize,
      total: obj.total != null ? obj.total : combinedUsers.length,
      totalPages: obj.totalPages != null ? obj.totalPages : 1,
      search: obj.search != null ? obj.search : search,
      basePath:
        req.params.organizationId !== undefined &&
        req.params.organizationId !== null &&
        String(req.params.organizationId).trim() !== ""
          ? `/user/suite-users/${organization}`
          : "/user/suite-users",
    };

    logger.info(`Controller - Render Suite Users: Users on page: ${combinedUsers.length}, total: ${suitePagination.total}`);


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
    
    const showBulkImportJobsNav = hasAccess(req, enums.ModuleNames.User_Management, [
      enums.Access_Types.RWD_O,
      enums.Access_Types.RWD_ALL,
      enums.Access_Types.R_ALL,
    ]);

    logger.info(`Controller - Render Suite Users: Rendering user list view with hasCreatePermission: ${hasCreatePermission}, isReadOnly: ${isReadOnly}`);
    return res.render(render_ejs_urls.ProductSuiteManagement.User_Management.LIST, {
      enableSuiteManagementLeftMenu: true,
      users: combinedUsers,
      hasCreatePermission,
      isReadOnly,
      locale: req.getLocale(),
      suiteListOrganizationId: organization,
      showBulkImportJobsNav,
      suitePagination,
    });

  } catch (error) {
    logger.error(`Error - Controller - Render User List:: ${error}`);
    logger.error(error.stack)
    req.flash("message", "Unable to fetch user list");
    req.flash("alertType", "error");
    return res.redirect(frontend_api_urls.PRODUCT_SUITE.Home.INDEX);
  }
};

