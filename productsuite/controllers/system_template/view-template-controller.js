const { logger } = require('../../../logger/logger');
const getApiClient = require('../../../utility/api-client');
const backend_api_urls = require('../../../config/backend_api_urls');
const { extractAttachmentInfo, FileFetcher, readFiles } = require('../../../utility/helperFunctions');
const render_ejs_urls = require('../../../config/render_ejs_urls');
const frontend_api_urls = require('../../../config/frontend_api_urls');
const enums = require("../../../contants/enum");

exports.viewTemplate = async (req, res) => {
  const templateId = String(req.params?.templateId || '').trim();
  logger.info('[View Template] request', { templateId, url: req.originalUrl, ip: req.ip });

  if (!templateId) {
    logger.warn('[View Template] missing templateId', { params: req.params });
    req.flash('message', 'Missing template id');
    req.flash('alertType', 'error');
    return res.redirect('/template/list');
  }

  const apiClient = getApiClient(req);
  if (!apiClient) {
    logger.error('[View Template] apiClient not available');
    req.flash('message', 'Error fetching template');
    req.flash('alertType', 'error');
    return res.redirect('/template/list');
  }

  // build backend url; fallback to a sensible path if config missing
  const backendUrl = backend_api_urls.PRODUCT_SUITE.Template.VIEW(templateId || 0);

  try {
    logger.info('[View Template] calling backend', { backendUrl });
    const response = await apiClient.get(backendUrl);

    // normalize response shape - backend returns the template object directly (res.json(template))
    const tpl = response?.data?.template
      ?? response?.data?.object
      ?? response?.data
      ?? {};

    logger.info('[View Template] fetched template' + JSON.stringify(tpl, null, 2));
    // debug: structured log + plain console output to inspect payload
    logger.info('[View Template] resolved tpl object' + { templateId, tplSummary: { keys: Object.keys(tpl || {}) } });
    try {
      logger.info('[View Template] tpl (full)' + { tpl });
    } catch (e) {
      logger.info('[View Template] tpl (raw)' + { tpl });
    }

    if (!tpl || Object.keys(tpl).length === 0) {
      logger.warn('[View Template] backend returned empty template', { backendUrl, status: response?.status });
      req.flash('message', 'Template not found');
      req.flash('alertType', 'error');
      return res.redirect('/template/list');
    }
    const selPhish = String(tpl?.PhishingCampaignType?.name).toLowerCase();
    tpl.selPhish = selPhish; // add a view-specific property for easier access in the template
    const filePath = String(tpl.file_attachment_path || '').trim();
    console.log(filePath);

    // extract attachment info using helper
    const filePathRaw = String(tpl.file_attachment_path || tpl.file_attachment || '').trim();
    if (filePathRaw) {
      const info = extractAttachmentInfo(filePathRaw);
      tpl.attachmentExt = info.attachmentExt; // e.g. ".pdf"
      tpl.file_extension = String(tpl.file_extension || info.file_extension || '').toLowerCase();
      logger.info('[View Template] attachment resolved' + JSON.stringify({ filePathRaw, filename: info.filename, attachmentExt: tpl.attachmentExt, file_extension: tpl.file_extension }));
    }


    const filesData = await readFiles(tpl.phishing_page_url, tpl.landing_page_url).catch(err => {
      return { phishing_page: null, landing_page: null };
    });
    logger.info('[View Template] readFiles result' + JSON.stringify(filesData, null, 2));

    tpl.phishing_page_content = filesData.phishing_page?.content || '';
    tpl.landing_page_content = filesData.landing_page?.content || '';
    tpl.phishing_smtp = tpl.phishing_smtp_id;
    if(tpl.PhishingCampaignType && tpl.PhishingCampaignType.name === enums.phishingTypeByNames.SMS) {
      tpl.sms_content = tpl?.phishing_content || '';
    }

    logger.info('[View Template] rendering view' + JSON.stringify(tpl, null, 2));
    let postMethodUrl = frontend_api_urls.PRODUCT_SUITE.System_Template.EDIT(templateId);
    if (req.user.organization_id) {
      postMethodUrl = frontend_api_urls.PRODUCT_SUITE.System_Template.CLONE(templateId, req.user.organization_id);
    }
    return res.render(render_ejs_urls.PhishMagnus.System_Template.SHOW, { postMethodUrl, template: tpl, enableSuiteManagementLeftMenu: false, isSystemTemplate: true });
  } catch (err) {
    // Detailed logging for different axios failure modes
    logger.error(`[View Template] error fetching template \n ${err.stack}`);
    if (err?.response) {
      req.flash('message', 'Error fetching template');
      req.flash('alertType', 'error');
      return res.redirect('/template/list');
    } else if (err?.request) {
      req.flash('message', 'Error fetching template');
      req.flash('alertType', 'error');
      return res.redirect('/template/list');
    } else {
      req.flash('message', 'Error fetching template');
      req.flash('alertType', 'error');
      return res.redirect('/template/list');
    }
  }
};