const config = require("../../../../config/env.config");

const { logger } = require("../../../../logger/logger");
const { redactEmail, redactLogData } = require("../../../utility/redact");
const ICONSTANTS = require("../../../../contants/ICONSTANTS");

const getApiClient = require('../../../../utility/api-client')
const enums = require("../../../../contants/enum");
const render_ejs_urls = require("../../../../config/render_ejs_urls");
const backend_api_urls = require("../../../../config/backend_api_urls");
const frontend_api_urls = require("../../../../config/frontend_api_urls");

exports.createUSBCampaign = async (req, res) => {
  logger.info("USB CAMPAIGN::: CREATE USB CAMPAIGN METHOD - STARTED");
  try {
    const user = req.user;
    const orgId = req.params.orgId === undefined ? user.organization_id : req.params.orgId;
    logger.info(`USB CAMPAIGN::: Request Method: ${req.method}, User: ${redactEmail(user?.email)}, Org: ${orgId}`);

    if (req.method === "GET") {
      logger.info("USB CAMPAIGN::: GET - Rendering create USB campaign page");
      return res.render(render_ejs_urls.PhishMagnus.Campaign.USB.RENDER_CREATE_FORM, {
        org: orgId,
        enumsDefaultOrg: null
      });
    }

    if (req.method === "POST") {
      logger.info("USB CAMPAIGN::: POST - Create campaign request received");
      logger.info("USB CAMPAIGN::: POST - Incoming payload: " + JSON.stringify(redactLogData(req.body)));

      const payload = req.body;
      const url = backend_api_urls.PHISHMAGNUS.CAMPAIGN.USB.CREATE;
      const apiClient = getApiClient(req);

      logger.info(`USB CAMPAIGN::: POST - API URL: ${url}`);
      logger.info(`USB CAMPAIGN::: POST - Final payload: ${JSON.stringify(redactLogData(payload))}`);

      try {
        const response = await apiClient.post(url, payload);
        logger.info("USB CAMPAIGN::: POST - API response: " + JSON.stringify(response?.data, null, 2));
        const message = response.data.message;
        const alertType = response.data.alertType;
        req.flash('alertType', alertType);
        req.flash('message', message);
        logger.info(`USB CAMPAIGN::: POST - Redirecting to campaign list with message: ${message}, alertType: ${alertType}`);
        return res.redirect(frontend_api_urls.PHISHMAGNUS.Campaign.USB.REPORT);
      } catch (error) {
        logger.error("USB CAMPAIGN::: POST - Exception in API call");
        logger.error(`Error message: ${error.message}`);
        logger.error(error);
        logger.error(error.stack);
        req.flash('alertType', 'error');
        req.flash('message', req.__('validation_messages.usb_campaign_creation_error'));
        return res.redirect(frontend_api_urls.PHISHMAGNUS.Campaign.USB.CREATE);
      }
    }

    logger.warn(`USB CAMPAIGN::: Unsupported HTTP method: ${req.method}`);
    return res.status(405).send("Method Not Allowed");

  } catch (error) {
    logger.error("USB CAMPAIGN::: EXCEPTION IN CREATE USB PHISHING");
    logger.error(`Error message: ${error.message}`);
    logger.error(error);
    logger.error(error.stack);
    req.flash('alertType', 'error');
    req.flash('message', req.__('validation_messages.usb_campaign_creation_error'));
    return res.redirect(frontend_api_urls.PHISHMAGNUS.Campaign.USB.CREATE);
  }
};


// exports.usbModule = async (req, res) => {
//   logger.info("NFC CAMPAIGN MODULE::: CREATE CREATE NFC CAMPAIGN METHOD");
//   try {

//     let user = req.user;
//     let orgId = req.params.orgId === undefined ? user.organization_id : req.params.orgId;

//     if (isMagAdmin(req.user.role.id)) {
//       logger.info("NFC CAMPAIGN MODULE::: FETCHING DATA AND USER IS MAGNUS ADMIN");
//       const report = await nfcReportCampaign(req, res);
//       return res.render("pages/campaign/nfc-campaign", {
//         report,

//         org: orgId,
//         enumsDefaultOrg: enums.defaultOrganization.SecureMagnus
//       });
//     } else {
//       logger.info("NFC CAMPAIGN MODULE::: FETCHING DATA AND USER IS NOT MAGNUS ADMIN");
//       const report = await nfcReportCampaign(req, res);
//       return res.render("pages/campaign/nfc-campaign", {
//         org: orgId,
//         enumsDefaultOrg: null,
//         report
//       });
//     }

//   } catch (error) {
//     logger.error("NFC CAMPAIGN MODULE::: EXCEPTION IN CREATE NFC PHISHING");
//     logger.error(`${error.message}`);
//     logger.error(error);
//     logger.error(error.stack);
//     res.redirect("/phm/?message=Issue in Crating a CREATE NFC CAMPAIGN&alertType=error");
//   }
// };