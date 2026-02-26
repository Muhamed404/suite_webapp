const { logger } = require("../../../logger/logger");
const getApiClient = require('../../../utility/api-client')
const enums = require("../../../contants/enum");
const { hasAccess } = require("../../../utility/helperFunctions");
const backend_api_urls = require("../../../config/backend_api_urls");
const render_ejs_urls = require("../../../config/render_ejs_urls");
const frontend_api_urls = require("../../../config/frontend_api_urls");


exports.showTemplate = async (req, res) => {
  try {
    logger.info('Controller - Show Template: Incoming request in system defined Template method')
    // console.log("My Template: INCOMING ORGANIZATION: " + orgId);

    let url = backend_api_urls.PRODUCT_SUITE.Template.LIST

    // const attFileTpypes = `/commons/getAttachmentFileTypes`;
    logger.info(`My Template: API URL  ${url}`);
    // logger.info(`My Template: API URL  ${attFileTpypes}`);
    const apiClient = getApiClient(req);

    // const [response, resAttFileTypes] = await Promise.all([
    const response = await apiClient.get(url)

    const { message: alertMessage, alertType, object: templates } = response.data;

    // logger.info(`Printing values ${alertMessage} , ${JSON.stringify(templates, null, 2)}`)
    if (alertType === 'error') {
      logger.warn('My Template: ' + alertMessage)
      throw new Error(alertMessage)
    } else {

    }
    const organizationId = req.user.organization_id;
    let templateTitleKey = 'system_template.homescreen.labelTitleSystemTemplateManagement'

    let disableOption = {
      disableCreateTemplate: false,
      disableCloneOption: true,
      disableEdit: false,
      disableDelete: false,
      disableView: false
    }

    if (organizationId) {
      disableOption.disableCreateTemplate = true;
      disableOption.disableCloneOption = false;
      disableOption.disableEdit = true;
      disableOption.disableDelete = true;
      disableOption.disableView = false;
    }
    logger.info(`Organization Id is ${organizationId} and disable options are ${JSON.stringify(disableOption, null, 2)}`)

    return res.render(render_ejs_urls.PhishMagnus.System_Template.VIEW, {
      // enableSuiteManagementLeftMenu: true,
      templates,
      disableOption,
      templateTitleKey,
      breadcrumbs: 'breadcrumbs.systemTemplate',
      // organization: organizationId
    });
  } catch (error) {
    logger.error(`My Template: Issue in retrieving fetching system templates`);
    logger.error(error.stack)
    
    if (req.session) {
      req.flash('message', 'Error fetching templates');
      req.flash('alertType', 'error');
    }
    return res.redirect(frontend_api_urls.PRODUCT_SUITE.System_Template.LIST);
  }
};
