const { logger } = require("../../../logger/logger");
const getApiClient = require('../../../utility/api-client')
const enums = require("../../../contants/enum");
const { hasAccess } = require("../../../utility/helperFunctions");
const backend_api_urls = require("../../../config/backend_api_urls");
const render_ejs_urls = require("../../../config/render_ejs_urls");
const frontend_api_urls = require("../../../config/frontend_api_urls");

const PHISH_TYPE_OPTIONS = [
  { key: 'email', label: 'Email', id: 2 },
  { key: 'sms', label: 'SMS', id: 1 },
  { key: 'whatsapp', label: 'Whatsapp', id: 4 },
  { key: 'usb', label: 'USB', id: 3 },
  { key: 'qr', label: 'QR', id: 5 },
  { key: 'nfc', label: 'NFC', id: 6 }
];


exports.retrieveAllTemplates = async (req, res) => {
  try {
    logger.info('Controller - Show Template: Incoming request in system defined Template method')
    const requestedPhishType = typeof req.query.phishType === 'string' ? req.query.phishType.toLowerCase() : 'all';
    const selectedOption = PHISH_TYPE_OPTIONS.find((option) => option.key === requestedPhishType);
    const selectedPhishType = selectedOption || { key: 'all', label: 'All', id: null };
    // console.log("My Template: INCOMING ORGANIZATION: " + orgId);
    // ✅ Add query parameters
    const queryParams = {
      organizationId: req.user.organization_id !== undefined ? req.user.organization_id : undefined,
    };

    if (selectedPhishType.key !== 'all' && selectedPhishType.id) {
      queryParams.phishType = selectedPhishType.id;
    }

    if (queryParams.organizationId === undefined) {
      req.flash('message', 'Invalid template type');
      req.flash('alertType', 'error');
      return res.redirect(frontend_api_urls.PHISHMAGNUS.Home);
    }
    let url = backend_api_urls.PRODUCT_SUITE.Template.PHM_LIST

    // const attFileTpypes = `/commons/getAttachmentFileTypes`;
    logger.info(`My Template: API URL  ${url}`);
    // logger.info(`My Template: API URL  ${attFileTpypes}`);
    const apiClient = getApiClient(req);

    // const [response, resAttFileTypes] = await Promise.all([
    const [response] = await Promise.all([
      apiClient.get(url, { params: queryParams }),
      // apiClient.get(attFileTpypes),
    ]);


    const { message: alertMessage, alertType, object: templates } = response.data;

    // logger.info(`Printing values ${alertMessage} , ${JSON.stringify(templates, null, 2)}`)
    if (alertType === 'error') {
      logger.warn('My Template: ' + alertMessage)
      throw new Error(alertMessage)
    } else {

    }
    const organizationId = queryParams.organizationId;
    let templateTitleKey = 'system_template.homescreen.labelTitleOrganizationTemplateManagement'
    let disableOption = {
      disableCreateTemplate: false,
      disableCloneOption: false,
      disableEdit: false,
      disableDelete: false,
      disableView: false
    }

    if (organizationId) {
      disableOption.disableCreateTemplate = false;
      disableOption.disableCloneOption = true;
      disableOption.disableEdit = false;
      disableOption.disableDelete = false;
      disableOption.disableView = false;
    }

    return res.render(render_ejs_urls.PhishMagnus.System_Template.VIEW, {
      // enableSuiteManagementLeftMenu: true,
      templates,
      typeOptions: PHISH_TYPE_OPTIONS,
      selectedPhishType,
      disableOption: disableOption,
      templateTitleKey,
      breadcrumbs: 'breadcrumbs.myTemplate',

      organization: organizationId,
    });
  } catch (error) {
    logger.error(`My Template: Issue in retrieving fetching system templates`);
    logger.error(error.stack)
    
    if (error.response && error.response.status === 403) {
      const errorMessage = error.response.data?.message || 'Access Denied';
      logger.warn(`[List Templates] Access denied: ${errorMessage}`);
      
      if (errorMessage.toLowerCase().includes('subscription')) {
        logger.warn(`[List Templates] Redirecting to home - no active subscription`);
        if (req.session) {
          req.flash('message', 'You do not have an active subscription to manage templates.');
          req.flash('alertType', 'error');
        }
        return res.redirect(frontend_api_urls.PHISHMAGNUS.Home.INDEX);
      }
    }
    
    if (req.session) {
      req.flash('message', 'Error fetching templates');
      req.flash('alertType', 'error');
    }
    return res.redirect(frontend_api_urls.PHISHMAGNUS.Home);
  }
};
