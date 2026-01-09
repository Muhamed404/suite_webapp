const { logger } = require("../../../../logger/logger");
const enums = require("../../../../contants/enum");
const nfcService = require('../../../services/campaign/nfc/nfc_service');
const render_ejs_urls = require("../../../../config/render_ejs_urls");
const frontend_api_urls = require("../../../../config/frontend_api_urls");
const TemplateService = require('../../../services/template/template-service');


exports.createNFCCampaign = async (req, res) => {
  logger.info("NFC CAMPAIGN MODULE::: CREATE NFC CAMPAIGN METHOD");
  try {
    let orgId = req.user.organization_id;

    if (req.method === "GET") {
      logger.info("NFC CAMPAIGN MODULE::: FETCHING DATA FOR GET REQUEST");
      try {

        const [
          templateResponse,
          systemTemplateResponse
        ] = await Promise.all([
          TemplateService.listTemplatesByOrgAndType(orgId, enums.phishingType.NFC, req).catch(err => ({ data: { message: [] }, _err: err })),
          TemplateService.getSystemTemplates(enums.phishingType.NFC, req).catch(err => ({ _err: err, templates: null }))
        ]);

        if (templateResponse?._err) logger.warn('[Create NFC Campaign] template fetch failed', { err: templateResponse._err && (templateResponse._err.stack || templateResponse._err.message) });
        if (systemTemplateResponse?._err) logger.warn('[Create NFC Campaign] system template fetch failed', { err: systemTemplateResponse._err && (systemTemplateResponse._err.stack || systemTemplateResponse._err.message) });

        // Normalize system templates into an array for rendering
        let systemTemplates = [];
        if (Array.isArray(systemTemplateResponse)) {
          systemTemplates = systemTemplateResponse;
        } else if (systemTemplateResponse == null) {
          systemTemplates = [];
        }

        logger.info(`[Create NFC Campaign] system templates count=${systemTemplates.length}`);
        logger.info(`[Create NFC Campaign] user templates count=${JSON.stringify(systemTemplates, null, 2)}`);

        return res.render(render_ejs_urls.PhishMagnus.Campaign.NFC.CREATE, {
          org: orgId,
          templates: templateResponse.data.message,
          systemTemplate: systemTemplates,
          enumsDefaultOrg: null
        });
      } catch (fetchError) {
        logger.error("Error fetching templates: " + fetchError.message);
        logger.error(fetchError.stack);
        req.flash('message', 'Error fetching in nfc campaign');
        req.flash('alertType', 'error');
        return res.redirect("/phm/index");
      }
    } else if (req.method === "POST") {
      logger.info("NFC CAMPAIGN MODULE::: POST::: CREATE");
      logger.info("Incoming payload: \n" + JSON.stringify(req.body));
      try {
        const data = await nfcService.createCampaign(req);
        if (!data.success) {
          req.flash('message', 'Unable to launch NFC campaign');
          req.flash('alertType', 'error');
          return res.redirect(frontend_api_urls.PHISHMAGNUS.Campaign.NFC.CREATE);
        }
        req.flash('message', data.message);
        req.flash('alertType', data.alertType);
        return res.redirect(frontend_api_urls.PHISHMAGNUS.Campaign.NFC.VIEW);
      } catch (apiError) {
        logger.error("Error creating NFC campaign: " + apiError.message);
        logger.error(apiError.stack);
        req.flash('message', 'Error creating NFC campaign ');
        req.flash('alertType', 'error');
        return res.redirect(frontend_api_urls.PHISHMAGNUS.Home.INDEX);

      }
    } 
  } catch (error) {
    logger.error("NFC CAMPAIGN MODULE::: EXCEPTION IN CREATE NFC PHISHING CAMPAIGN");
    logger.error(error.message);
    logger.error(error.stack);
    req.flash('message', 'Error creating NFC campaign ');
    req.flash('alertType', 'error');
    return res.redirect(frontend_api_urls.PHISHMAGNUS.Home.INDEX);
  }
};