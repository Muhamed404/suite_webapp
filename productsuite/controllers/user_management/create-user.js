const { logger } = require("../../../logger/logger");
const { getFilteredRolesByOrganizationLevel } = require("../../../commons/commons");
const { hasAccess, cleanEmail } = require("../../../utility/helperFunctions");
const ICONSTANTS = require("../../../contants/ICONSTANTS");
const enums = require('../../../contants/enum')
const getApiClient = require('../../../utility/api-client');
const { redactEmail } = require("../../../utility/redact");
const render_ejs_urls = require("../../../config/render_ejs_urls");
const frontend_api_urls = require("../../../config/frontend_api_urls");




exports.create = async (req, res, next) => {
  logger.info(`[Create User Controller] Entered Create User Controller with method ${req.method}`);
  try {
    if (req.method === "GET") {
      let userSession = req.user;

      let organizationCode = userSession.organization_id;
      if (organizationCode === undefined || organizationCode === null || isNaN(organizationCode)) {
        logger.warn(`[Create User Controller] Invalid organization ID`);
        req.flash("message", "Invalid Organization ID. Please contact administrator.");
        req.flash("alertType", "error");
        return res.redirect(frontend_api_urls.PRODUCT_SUITE.User_Management.SUITE_USERS);
      }

      if (req.user.role.id === enums.userType.MagSuperAdmin || req.user.role.id === enums.userType.MagSubAdmin) {
        logger.info(`[Create User Controller] MAG Admin user trying to access create user page. Setting orgId to 0`);
        organizationCode = 0;
      } else {
        logger.info(`[Create User Controller] Non MAG Admin user trying to access create user page. Setting orgId from session: ${organizationCode}`);
        organizationCode = userSession.organization_id;
      }


      const organizationRoles = await getFilteredRolesByOrganizationLevel(req, organizationCode);

      // let subscription = null;
      // const apiClient = getApiClient(req);
      const hasCreatePermission = Boolean(false);
      const disableSubmitBtn = Boolean(false)
     

      if (!hasAccess(req, enums.ModuleNames.User_Management, [enums.Access_Types.RWD_ALL, enums.Access_Types.RW_O, enums.Access_Types.RWD_O])) {
        logger.info(`[Create User Controller] Enabling Create Button for user: ` + redactEmail(userSession.email))

        hasCreatePermission = Boolean(true)
      }
      logger.info(`[Create User Controller] Applications: ${JSON.stringify(enums.Product_Selection, null, 2)}`)
      const renderData = {
        Applications: enums.Product_Selection,
        enableSuiteManagementLeftMenu: true,
        roles: organizationRoles,
        hasCreatePermission,
        userTypes: enums.userType,
        orgId: organizationCode,
        enumServices: enums.serviceTypes,
        disableSubmitBtn,
        organization: organizationCode
      };

      res.render(render_ejs_urls.ProductSuiteManagement.User_Management.CREATE_USER, renderData);
    }
  } catch (error) {
    logger.error(`Error in Create User Controller: ${error}`);
    logger.error(error.stack)
    req.flash("message", "Some Issue. Contact Administrator");
    req.flash("alertType", "error");
    return res.redirect(frontend_api_urls.PHISHMAGNUS.Home.INDEX);
  }
};




exports.submitCreationForm = async (req, res, next) => {
  logger.info(`[UserCreationSubmit] Incoming request for user:${JSON.stringify(redactEmail(req.body.email), null, 2)}`);
  try {
    if (req.method === "POST") {
      const email = cleanEmail(req.body?.email || '')  || null;
      const first_name = req.body?.first_name || null;
      const last_name = req.body?.last_name || null;
      const password = req.body?.password || null;
      const contact = req.body?.contact || null;
      const role = req.body?.role || null;
      const selectedProductKey = req.body?.application || null;

      if (!email || email === null || !first_name || first_name === null || !last_name || last_name === null
        || !contact || contact === null || !role || role === null) {
        logger.warn(`[UserCreationSubmit] Create User: Missing required fields in the form submission`);
        req.flash("message", "All fields are required.");
        req.flash("alertType", "error");
        return res.redirect(frontend_api_urls.PRODUCT_SUITE.User_Management.CREATE_USER);
      }

      const user = {
        email,
        first_name,
        last_name,
        password,
        contact,
        role_id: role,
        selectedProductKey
      };
      logger.info('[UserCreationSubmit] Create User: Posting user payload ' + JSON.stringify(redactEmail(user.email), null, 2));
      let userOrganizationId = req.user.organization_id;
      if (userOrganizationId !== undefined && userOrganizationId !== null && !isNaN(userOrganizationId)
        && userOrganizationId !== 0) {
        userOrganizationId = Number(userOrganizationId);
      } else if (req.user.role.id === enums.userType.MagSuperAdmin || req.user.role.id === enums.userType.MagSubAdmin) {
        logger.info(`[UserCreationSubmit] Create User: MAG Admin user trying to create user. Setting orgId to 0`);
        userOrganizationId = 0;
      }
      const url = `/user/create/${userOrganizationId}`;
      const apiClient = getApiClient(req);
      apiClient
        .post(url, user)
        .then((response) => {
          req.flash("message", 'User created successfully');
          req.flash("alertType", "success");
          return res.redirect(frontend_api_urls.PRODUCT_SUITE.User_Management.SUITE_USERS);
        })
        .catch((error) => {
          logger.error(`error => ${error}`);
          logger.error(error.stack)
          const errMsg = error.response?.data?.message || error.message || 'Unable to create user';
          req.flash("message", errMsg);
          req.flash("alertType", "error");
          return res.redirect(frontend_api_urls.PRODUCT_SUITE.User_Management.SUITE_USERS);
        });
    }
  } catch (error) {
    logger.error(`Error - Create User: ${error}`);
    logger.error('Error - Create User:' + error.stack)
    req.flash("message", 'Unable to create user');
    req.flash("alertType", "error");
    return res.redirect(frontend_api_urls.PRODUCT_SUITE.User_Management.SUITE_USERS);

  }
};