const { logger } = require("../../../logger/logger");
const { getFilteredRolesByOrganizationLevel } = require("../../../commons/commons");
const { hasAccess } = require("../../../utility/helperFunctions");
const ICONSTANTS = require("../../../contants/ICONSTANTS");
const enums = require('../../../contants/enum')
const getApiClient = require('../../../utility/api-client');
const { redactLogData } = require("../../../utility/redact");
const render_ejs_urls = require("../../../config/render_ejs_urls");
const frontend_api_urls = require("../../../config/frontend_api_urls");
const backend_api_urls = require("../../../config/backend_api_urls");




exports.createSecureMagnusUser = async (req, res, next) => {
  logger.info(`Controller - SecureMagnus User: Incoming request with method ${req.method}`);
  try {
    if (req.method === "GET") {
      let userSession = req.user;

      let organizationCode = userSession.organization_id ? null : 0;

      const organizationRoles = await getFilteredRolesByOrganizationLevel(req, organizationCode);



      const renderData = {
        enableSuiteManagementLeftMenu: true,
        roles: organizationRoles,
        methodUrl: frontend_api_urls.PRODUCT_SUITE.User_Management.CREATE_SECUREMAGNUS_USER,
      };

      res.render(render_ejs_urls.ProductSuiteManagement.User_Management.CREATE_SECUREMAGNUS_USER, renderData);
    }
  } catch (error) {
    logger.error(`Controller - SecureMagnus User: Error in Create Securemagnus User Controller: ${error}`);
    logger.error(error.stack)
    req.flash("message", "Some Issue. Contact Administrator");
    req.flash("alertType", "error");
    return res.redirect(frontend_api_urls.PHISHMAGNUS.Home.INDEX);
  }
};




exports.submitSecureMagnusUser = async (req, res, next) => {
  logger.info(`Controller - Create Securemagnus User: Incoming body ${JSON.stringify(redactLogData(req.body), null, 2)}`);
  try {
    const email = req.body?.email || null;
    const first_name = req.body?.first_name || null;
    const last_name = req.body?.last_name || null;
    const password = req.body?.password || null;
    const contact = req.body?.contact || null;
    const role = req.body?.role || null;
    if (role === null || role === undefined) {
      logger.warn(`Controller - Create Securemagnus User: Role is missing in the form submission`);
      req.flash("message", "Role is required.");
      req.flash("alertType", "error");
      return res.redirect(frontend_api_urls.PRODUCT_SUITE.User_Management.CREATE_SECUREMAGNUS_USER);
    }

    if (!email || email === null || !first_name || first_name === null || !last_name || last_name === null
      || !contact || contact === null || !role || role === null) {
      logger.warn(`Controller - Create Securemagnus User: Missing required fields in the form submission`);
      req.flash("message", "All fields are required.");
      req.flash("alertType", "error");
      return res.redirect(frontend_api_urls.PRODUCT_SUITE.User_Management.CREATE_SECUREMAGNUS_USER);
    }

    const user = {
      email,
      first_name,
      last_name,
      password,
      contact,
      role_id: role
    };
    logger.info('Controller - Create Securemagnus User: Posting user payload ' + JSON.stringify(redactLogData(user), null, 2))

    const url = backend_api_urls.PRODUCT_SUITE.User_Management.CREATE_SECUREMAGNUS_USER;
    const apiClient = getApiClient(req);
    const response = await apiClient.post(url, user);
    logger.info(`Controller - Create Securemagnus User: Received response with status ${response.status} and data: ${JSON.stringify(redactLogData(response.data), null, 2)}`);

    if (!response.data.success) {
      req.flash("message", response.data.message || 'Unable to Create Securemagnus User');
      req.flash("alertType", "error");
      return res.redirect(frontend_api_urls.PRODUCT_SUITE.User_Management.CREATE_SECUREMAGNUS_USER);
    }

    req.flash("message", response.data.message || 'User created successfully');
    req.flash("alertType", "success");
    return res.redirect(frontend_api_urls.PRODUCT_SUITE.User_Management.SECUREMAGNUS_USERS_LIST);

  } catch (error) {
    logger.error(`Error - Create Securemagnus User: ${error}`);
    logger.error('Error - Create Securemagnus User:' + error.stack)
    req.flash("message", 'Unable to Create Securemagnus User');
    req.flash("alertType", "error");
    return res.redirect(frontend_api_urls.PRODUCT_SUITE.User_Management.SECUREMAGNUS_USERS_LIST);

  }
};