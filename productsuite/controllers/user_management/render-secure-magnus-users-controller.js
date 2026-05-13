const { logger } = require("../../../logger/logger");
const { hasAccess } = require("../../../utility/helperFunctions");
const ICONSTANTS = require("../../../contants/ICONSTANTS");
const enums = require('../../../contants/enum')
const getApiClient = require('../../../utility/api-client');
const { redactEmail, redactLogData } = require("../../../utility/redact");
const render_ejs_urls = require("../../../config/render_ejs_urls");
const frontend_api_urls = require("../../../config/frontend_api_urls");
const backend_api_urls = require("../../../config/backend_api_urls");




exports.renderSecureMagnusUsers = async (req, res) => {
  logger.info(`Controller - Render Securemagnus Users: Incoming request.`);
  try {
 

    let url = backend_api_urls.PRODUCT_SUITE.User_Management.LIST_SECUREMAGNUS_USERS;

    const apiClient = getApiClient(req);
    const response = await apiClient.get(url);

    const users = response.data.object;

    logger.info(`Controller - Render Securemagnus Users: Users count: ${users.length}`);

    let hasCreatePermission = Boolean(true);
    let userSession = req?.user;
    if (!hasAccess(req, enums.ModuleNames.User_Management, [enums.Access_Types.RWD_ALL])) {
      logger.info(`Controller - Render Securemagnus Users: Disabling Create Button for user: ` + redactEmail(userSession.email))

      hasCreatePermission = Boolean(false)
    }
    logger.info(`Controller - Render Securemagnus Users: Rendering Securemagnus Users List Page`);
    logger.info(JSON.stringify(redactLogData(users.slice(0, 2)), null, 2))
    return res.render(render_ejs_urls.ProductSuiteManagement.User_Management.LIST_SECUREMAGNUS_USERS, {
      enableSuiteManagementLeftMenu: true,
      users: users,
      hasCreatePermission
    });

  } catch (error) {
    logger.error(`Error - Controller - Render Securemagnus Users: ${error}`);
    logger.error(error.stack)
    req.flash("message", "Unable to fetch user list");
    req.flash("alertType", "error");
    return res.redirect(frontend_api_urls.PRODUCT_SUITE.Home);
  }
};

