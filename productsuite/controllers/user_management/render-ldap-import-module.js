const { logger } = require("../../../logger/logger");
const { getFilteredRolesByOrganizationLevel } = require("../../../commons/commons");
const { hasAccess } = require("../../../utility/helperFunctions");
const enums = require("../../../contants/enum");
const getApiClient = require("../../../utility/api-client");
const render_ejs_urls = require("../../../config/render_ejs_urls");
const frontend_api_urls = require("../../../config/frontend_api_urls");
const { redactEmail, redactLogData } = require("../../../utility/redact");

exports.renderLdapImportModule = async (req, res, next) => {
  logger.info(`[Render LDAP Import Module] Entered with method ${req.method}`);
  try {
    let userSession = req.user;
    const roleId = Number(userSession.role?.id || userSession.role_id || 0);
    const isMagAdmin = roleId === enums.userType.MagSuperAdmin || roleId === enums.userType.MagSubAdmin;

    let organizationCode = isMagAdmin
      ? Number(req.params.organizationId || 0)
      : Number(userSession.organization_id || 0);

    if (!organizationCode || isNaN(organizationCode) || organizationCode <= 0) {
      logger.warn(`[Render LDAP Import Module] Invalid organization ID`);
      req.flash("message", "Invalid Organization ID. Please contact administrator.");
      req.flash("alertType", "error");
      return res.redirect(frontend_api_urls.PRODUCT_SUITE.User_Management.SUITE_USERS);
    }

    const organizationRoles = await getFilteredRolesByOrganizationLevel(req, organizationCode);
    let respSubscription = null;
    let subscription = null;
    const apiClient = getApiClient(req);
    let hasCreatePermission = false;
    let disableSubmitBtn = false;

    if (organizationCode !== 0) {
      let subscriptionUrl = `/subscription/findAllByOrg/${organizationCode}`;
      respSubscription = await apiClient.get(subscriptionUrl);
      subscription = respSubscription.data.message;
    }

    if (!hasAccess(req, enums.ModuleNames.User_Management, [enums.Access_Types.RWD_ALL, enums.Access_Types.RW_O, enums.Access_Types.RWD_O])) {
      hasCreatePermission = true;
    }

    let ldapConfigured = false;
    try {
      const ldapConfigResp = await apiClient.get(`/org/${organizationCode}/ldap/config`);
      const cfg = ldapConfigResp.data?.data || ldapConfigResp.data?.message || null;
      ldapConfigured = !!(cfg && cfg.host);
    } catch (ldapErr) {
      ldapConfigured = false;
    }

    const renderData = {
      Applications: enums.Product_Selection,
      enableSuiteManagementLeftMenu: true,
      roles: organizationRoles,
      hasCreatePermission,
      userTypes: enums.userType,
      orgId: organizationCode,
      enumServices: enums.serviceTypes,
      disableSubmitBtn,
      organization: organizationCode,
      ldapConfigured,
    };

    if (subscription !== null && subscription !== undefined && subscription !== false && subscription !== 0 && subscription !== '' && !Number.isNaN(subscription)) {
      renderData.available_quota = subscription[0]?.available_quota || 0;
      renderData.disableSubmitBtn = renderData.available_quota === 0 ? true : false;
    } else if (req.user.role.id === enums.userType.MagSuperAdmin || req.user.role.id === enums.userType.MagSubAdmin) {
      renderData.available_quota = 100000000;
    }

    res.render(render_ejs_urls.ProductSuiteManagement.User_Management.LDAP_IMPORT, renderData);
  } catch (error) {
    logger.error(`Error in Render LDAP Import Module: ${redactLogData(error)}`);
    logger.error(redactLogData(error.stack));
    req.flash("message", "Some Issue. Contact Administrator");
    req.flash("alertType", "error");
    return res.redirect(frontend_api_urls.PHISHMAGNUS.Home.INDEX);
  }
};
