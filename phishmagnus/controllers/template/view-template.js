const { logger } = require('../../../logger/logger');
const getApiClient = require('../../../utility/api-client');
const backend_api_urls = require('../../../config/backend_api_urls');
const { extractAttachmentInfo, FileFetcher, readFiles } = require('../../../utility/helperFunctions');
const frontend_api_urls = require('../../../config/frontend_api_urls');
const render_ejs_urls = require('../../../config/render_ejs_urls');
const enums = require('../../../contants/enum');
const { redactLogData } = require('../../../utility/redact');

exports.viewTemplate = async (req, res) => {
  const templateId = String(req.params?.templateId || '').trim();
  logger.info('Controller - View Template: request', redactLogData({ templateId, url: req.originalUrl, ip: req.ip }));

  if (!templateId) {
    logger.warn('Controller - View Template: missing templateId', { params: req.params });
    req.flash('message', 'Missing template id');
    req.flash('alertType', 'error');
    return res.redirect(frontend_api_urls.PHISHMAGNUS.Template.LIST);
  }

  const apiClient = getApiClient(req);
  if (!apiClient) {
    logger.error('Controller - View Template: apiClient not available');
    req.flash('message', 'Error fetching template');
    req.flash('alertType', 'error');
    return res.redirect(frontend_api_urls.PHISHMAGNUS.Template.LIST);

  }

  // build backend url; fallback to a sensible path if config missing
  const id = templateId ?? 0;  // Use 0 if null or undefined
  const backendUrl = backend_api_urls.PRODUCT_SUITE.Template.PHM_VIEW(id);


  try {
    logger.info('Controller - View Template: calling backend', { backendUrl });
    const response = await apiClient.get(backendUrl);

    // normalize response shape - backend returns the template object directly (res.json(template))
    const tpl = response?.data?.template
      ?? response?.data?.object
      ?? response?.data
      ?? {};

    logger.info('Controller - View Template: fetched template' + JSON.stringify(redactLogData(tpl), null, 2));
    // debug: structured log + plain console output to inspect payload
    logger.info('Controller - View Template: resolved tpl object' + JSON.stringify(redactLogData({ templateId, tplSummary: { keys: Object.keys(tpl || {}) } })));
    try {
      logger.info('Controller - View Template: tpl (full)' + JSON.stringify(redactLogData({ tpl })));
    } catch (e) {
      logger.info('Controller - View Template: tpl (raw)' + JSON.stringify(redactLogData({ tpl })));
    }

    if (!tpl || Object.keys(tpl).length === 0) {
      logger.warn('Controller - View Template: backend returned empty template', { backendUrl, status: response?.status });
      req.flash('message', 'Template not found');
      req.flash('alertType', 'error');
      return res.redirect('/template/list');
    }
    const selPhish = String(tpl?.PhishingCampaignType?.name).toLowerCase();
    tpl.selPhish = selPhish; // add a view-specific property for easier access in the template
    const filePath = String(tpl.file_attachment_path || '').trim();

    // extract attachment info using helper
    const filePathRaw = String(tpl.file_attachment_path || tpl.file_attachment || '').trim();
    if (filePathRaw) {
      const info = extractAttachmentInfo(filePathRaw);
      tpl.attachmentExt = info.attachmentExt; // e.g. ".pdf"
      tpl.file_extension = String(tpl.file_extension || info.file_extension || '').toLowerCase();
      logger.info('Controller - View Template: attachment resolved' + JSON.stringify(redactLogData({ filePathRaw, filename: info.filename, attachmentExt: tpl.attachmentExt, file_extension: tpl.file_extension })));
    }

    const landingPageUrl = String(tpl.landing_page_url || '').trim();
    const isExternalLandingPageUrl = /^https?:\/\//i.test(landingPageUrl);
    const filesData = await readFiles(tpl.phishing_page_url, isExternalLandingPageUrl ? null : tpl.landing_page_url);
    logger.info('Controller - View Template: readFiles result' + JSON.stringify(redactLogData(filesData), null, 2));

    tpl.phishing_page_content = filesData.phishing_page?.content || '';
    tpl.landing_page_content = filesData.landing_page?.content || '';
    tpl.landing_page_option = isExternalLandingPageUrl ? 'url' : 'html';
    tpl.landing_page_external_url = isExternalLandingPageUrl ? landingPageUrl : '';
    tpl.phishing_smtp = tpl.phishing_smtp_id; // ensure this property exists for the view, even if null

    // Enforce exactly one slash after bucket root to avoid malformed .../o... paths.
    const webBucketRoot = (process.env.WEB_TEMPLATE_BUCKET || '').replace(/\/+$/, '');
    if (webBucketRoot) {
      ['phishing_content', 'phishing_page_content', 'landing_page_content'].forEach((field) => {
        if (!tpl[field] || !tpl[field].includes('<%=web_bucket%>')) return;
        tpl[field] = tpl[field]
          .split('<%=web_bucket%>/').join(`${webBucketRoot}/`)
          .split('<%=web_bucket%>').join(`${webBucketRoot}/`);
      });
    }
    // if(!tpl.phish_option){
    //   if(tpl.phishcat_id === enums.phishingCategories.DataEntryBasedPhishing){
    //     tpl.phish_option = 'data_entry';
    //   } else if(tpl.phishcat_id === enums.phishingCategories.ClickURLPhishing){
    //     tpl.phish_option = 'simple';
    //   }
    // }
    logger.info('Controller - View Template: rendering view' + JSON.stringify(redactLogData(tpl), null, 2));
    const postMethodUrl = '/phm/template/update/' + tpl?.id;

    return res.render(render_ejs_urls.PhishMagnus.System_Template.SHOW, { 
      template: tpl, 
      enableSuiteManagementLeftMenu: false, 
      postMethodUrl,
      webTemplateBucket: process.env.WEB_TEMPLATE_BUCKET
    });
  } catch (err) {
    // Detailed logging for different axios failure modes
    logger.error(`Controller - View Template: error fetching template \n ${err.stack}`);
    
    if (err?.response?.status === 403) {
      const errorMessage = err.response.data?.message || 'Access Denied';
      logger.warn(`[View Template] Access denied: ${errorMessage}`);
      
      if (errorMessage.toLowerCase().includes('subscription')) {
        if (req.session) {
          req.flash('message', 'You do not have an active subscription to view templates.');
          req.flash('alertType', 'error');
        }
        return res.redirect(frontend_api_urls.PHISHMAGNUS.Home.INDEX);
      }
    }
    
    if (err?.response) {
      if (req.session) {
        req.flash('message', 'Error fetching template');
        req.flash('alertType', 'error');
      }
      return res.redirect('/template/list');
    } else if (err?.request) {
      if (req.session) {
        req.flash('message', 'Error fetching template');
        req.flash('alertType', 'error');
      }
      return res.redirect('/template/list');
    } else {
      if (req.session) {
        req.flash('message', 'Error fetching template');
        req.flash('alertType', 'error');
      }
      return res.redirect('/template/list');
    }
  }
};