const config = require("../../../../config/env.config");
const { logger } = require("../../../../logger/logger");
const TemplateService = require('../../../services/template/template-service');
const uploadFileMulterMiddleware = require("../../../../middleware/campaign-multer-middleware");
const enums = require("../../../../contants/enum");
// const { qrReportCampaign } = require("./qr-report-campaign.js----");
const path = require('path');
const getApiClient = require('../../../../utility/api-client');
const frontend_api_urls = require("../../../../config/frontend_api_urls");
const ApplicationConstants = require('../../../../contants/application-constants');
const render_ejs_urls = require("../../../../config/render_ejs_urls");
const { redactLogData } = require("../../../utility/redact");


exports.createCampaign = async (req, res) => {
  logger.info(`Incoming request in createQRCampaign`);
  try {
    if (req.method === "GET") {
      let user = req.user;
      let orgId = user.organization_id;
      logger.info(`[QR CAMPAIGN][CREATE][GET] orgId resolved: ${orgId}`);

      // Fetch templates
      logger.info(`[QR CAMPAIGN][CREATE][GET] Fetching user and system templates for orgId: ${orgId}`);


      const [
        templateResponse,
        systemTemplateResponse
      ] = await Promise.all([
        TemplateService.listTemplatesByOrgAndType(orgId, enums.phishingType.QR, req).catch(err => ({ data: { message: [] }, _err: err })),
        TemplateService.getSystemTemplates(enums.phishingType.QR, req).catch(err => ({ _err: err, templates: null }))
      ]);

      if (templateResponse?._err) logger.warn('[Create QR Campaign] template fetch failed', { err: templateResponse._err && (templateResponse._err.stack || templateResponse._err.message) });
      if (systemTemplateResponse?._err) logger.warn('[Create QR Campaign] system template fetch failed', { err: systemTemplateResponse._err && (systemTemplateResponse._err.stack || systemTemplateResponse._err.message) });

      // Normalize system templates into an array for rendering
      let systemTemplates = [];
      if (Array.isArray(systemTemplateResponse)) {
        systemTemplates = systemTemplateResponse;
      } else if (systemTemplateResponse == null) {
        systemTemplates = [];
      }

      logger.info(`[Create QR Campaign] system templates count=${systemTemplates.length}`);
      logger.info(`[Create QR Campaign] user templates count=${JSON.stringify(systemTemplates, null, 2)}`);


      return res.render(render_ejs_urls.PhishMagnus.Campaign.QR.CREATE, {
        org: orgId,
        templates: templateResponse.data.message,
        systemTemplate: systemTemplates,
        enumsDefaultOrg: null
      });
    }
  } catch (error) {
    logger.error(`[QR CAMPAIGN][CREATE][${req.method}] Exception`);
    logger.error(`[QR CAMPAIGN][CREATE][${req.method}] Error message: ${error.message}`);
    logger.error(error);
    logger.error(error.stack);
    req.flash('message', 'Error creating QR campaign ');
    req.flash('alertType', 'error');
    return res.redirect(frontend_api_urls.PHISHMAGNUS.Home.INDEX);
  }
};

exports.submitForm = async (req, res) => {
  logger.info(`[QR CAMPAIGN][SUBMIT][${req.method}] Entry | User: ${req?.user?.id || 'unknown'}`);
  let user = req.user;

  try {
    if (req.method === "POST") {
      logger.info(`[QR CAMPAIGN][SUBMIT][POST] Incoming payload: ${JSON.stringify(redactLogData(req.body), null, 2)}`);

      let payload = req.body;

      // Basic validation
      if (!payload.name || !payload.name.trim()) {
        logger.warn('Campaign name is missing');
        req.flash('message', 'Campaign name is required');
        req.flash('alertType', 'error');
        return res.redirect('/phm/campaign/qr/create');
      }

      if (!payload.templateSelect) {
        logger.warn('Invalid Template has passed in qr campaign: ' + payload.templateSelect);
        req.flash('message', req.__('validation_messages.invalid_qr_template_selected'));
        req.flash('alertType', 'error');
        return res.redirect('/phm/campaign/qr/create');
      }

      // Convert and validate templateSelect as integer
      const templateId = Number(payload.templateSelect);
      if (!Number.isInteger(templateId) || templateId <= 0) {
        logger.warn('Invalid Template ID: ' + payload.templateSelect);
        req.flash('message', 'Invalid Template ID (must be a positive integer)');
        req.flash('alertType', 'error');
        return res.redirect('/phm/campaign/qr/create');
      }

      if (!payload.noOfQRTags) {
        logger.warn('Invalid Number of QR Tags has passed in qr campaign: ' + payload.noOfQRTags);
        req.flash('message', 'Invalid Number of QR Tags');
        req.flash('alertType', 'error');
        return res.redirect('/phm/campaign/qr/create');
      }

      // Convert and validate noOfQRTags as number
      const noOfQRTags = Number(payload.noOfQRTags);
      if (!Number.isInteger(noOfQRTags) || noOfQRTags <= 0) {
        logger.warn('Number of QR Tags out of range: ' + noOfQRTags);
        req.flash('message', 'Number of QR Tags must be between 1 and 1000');
        req.flash('alertType', 'error');
        return res.redirect('/phm/campaign/qr/create');
      }

      if (!payload.startTime || !payload.endTime) {
        logger.warn('Start time or end time missing');
        req.flash('message', 'Campaign schedule is required');
        req.flash('alertType', 'error');
        return res.redirect('/phm/campaign/qr/create');
      }

      // Handle file upload - now optional
      const phishingCampaignDirectoryPath = ApplicationConstants.QR_CODE_STORAGE_DIR;
      let filePath = null;

      if (req.file) {
        const newFileName = req.file.filename;
        filePath = path.join(phishingCampaignDirectoryPath, newFileName);
        logger.info(`[QR CAMPAIGN][SUBMIT][POST] File uploaded: ${newFileName} | Full path: ${filePath}`);
      } else {
        logger.info(`[QR CAMPAIGN][SUBMIT][POST] No custom QR image uploaded. System will use default QR generation.`);
      }

      // Build API payload with converted numbers
      const newPayload = {
        name: payload.name.trim(),
        description: payload.description?.trim() || '',
        templateOption: payload.templateOption,
        templateId: templateId, // Now a number
        noOfQRTags: noOfQRTags, // Now a number
        startTime: payload.startTime,
        endTime: payload.endTime,
        filePath: filePath || undefined
      };

      logger.info(`[QR CAMPAIGN][SUBMIT][POST] Final payload to API: ${JSON.stringify(redactLogData(newPayload))}`);

      const apiClient = getApiClient(req);
      const url = `/phm/campaign/qr/create`;
      logger.info(`[QR CAMPAIGN][SUBMIT][POST] API URL: ${url}`);

      const response = await apiClient.post(url, newPayload);
      logger.info(`[QR CAMPAIGN][SUBMIT][POST] API response: ${JSON.stringify(response.data)}`);
      if (!response.data.success) {
        req.flash('message', response.data?.message || 'Error creating QR campaign');
        req.flash('alertType', 'error');
        return res.redirect('/phm/campaign/qr/create');
      }
      let message = response.data?.message || 'QR Campaign created successfully';
      let alertType = 'success';
      let campaign = response.data?.object || null;

      req.flash('message', message);
      req.flash('alertType', alertType);

      if (campaign?.id) {
        logger.info(`[QR CAMPAIGN][SUBMIT][POST] Redirecting to campaign details: campId=${campaign.id}`);
        return res.redirect(frontend_api_urls.PHISHMAGNUS.Campaign.QR.VIEW(campaign.id));
      } else {
        return res.redirect(frontend_api_urls.PHISHMAGNUS.Campaign.QR.RENDER_QR_REPORT);
      }
    }
  } catch (error) {
    logger.error(`[QR CAMPAIGN][SUBMIT][${req.method}] Exception: ${error.message}`);
    logger.error(error.stack);
    req.flash('message', 'Error creating QR campaign');
    req.flash('alertType', 'error');
    return res.redirect(frontend_api_urls.PHISHMAGNUS.Campaign.QR.CREATE);

  }
};
