
const { logger } = require("../../../logger/logger");
const enums = require("../../../contants/enum");
const getApiClient = require('../../../utility/api-client');
const { hasAccess } = require("../../../utility/helperFunctions");
const { redactLogData } = require("../../../utility/redact");


exports.listOrganizations = async (req, res) => {
  try {

    logger.info('[List Organization]: Incoming Request')
    const url = `/organization/`;
    const apiClient = getApiClient(req); // get the customized Axios instance
    const response = await apiClient.get(url);
    const data = response.data.message;
    logger.debug('[List Organization]: Pringint List Organization: ' + JSON.stringify(redactLogData(data)))
    const hasPermission = hasAccess(req, enums.ModuleNames.Organization, [enums.Access_Types.RWD_ALL]);

    if (data.length > 0) {
      res.render("pages/organization/view-organization", {
        enableSuiteManagementLeftMenu: true,
        hasCreateAccess: hasPermission,
        organization: data,
        enums: enums.userType,
        // enumsDefaultOrg: enums.defaultOrganization
      });
    } else {
      logger.info("inside else block");
      res.render("pages/organization/view-organization", { enableSuiteManagementLeftMenu: true, hasCreateAccess: hasPermission, });
    }

    //res.status(response.status).json(response.data);
  } catch (error) {
    logger.error("Error listing organizations:", redactLogData(error));
    //res.status(error.response.status).json(error.response.data);
    res.redirect("/phm/");
  }
}