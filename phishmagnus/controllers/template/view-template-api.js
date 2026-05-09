const { logger } = require('../../../logger/logger');
const getApiClient = require('../../../utility/api-client');
const backend_api_urls = require('../../../config/backend_api_urls');
const { extractAttachmentInfo, readFiles } = require('../../../utility/helperFunctions');

/**
 * API endpoint to fetch template details in JSON format
 * Used for campaign preview functionality
 */
exports.viewTemplateApi = async (req, res) => {
  const templateId = String(req.params?.templateId || '').trim();
  logger.info('API - View Template: request', { templateId, url: req.originalUrl, ip: req.ip });

  if (!templateId) {
    logger.warn('API - View Template: missing templateId', { params: req.params });
    return res.status(400).json({
      success: false,
      message: 'Missing template id'
    });
  }

  const apiClient = getApiClient(req);
  if (!apiClient) {
    logger.error('API - View Template: apiClient not available');
    return res.status(500).json({
      success: false,
      message: 'Error fetching template'
    });
  }

  const id = templateId ?? 0;
  const backendUrl = backend_api_urls.PRODUCT_SUITE.Template.PHM_VIEW(id);

  try {
    logger.info('API - View Template: calling backend', { backendUrl });
    const response = await apiClient.get(backendUrl);

    // Normalize response shape
    const tpl = response?.data?.template
      ?? response?.data?.object
      ?? response?.data
      ?? {};

    logger.info('API - View Template: fetched template', { templateId, keys: Object.keys(tpl || {}) });

    if (!tpl || Object.keys(tpl).length === 0) {
      logger.warn('API - View Template: backend returned empty template', { backendUrl, status: response?.status });
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // Extract attachment info if exists
    const filePathRaw = String(tpl.file_attachment_path || tpl.file_attachment || '').trim();
    if (filePathRaw) {
      const info = extractAttachmentInfo(filePathRaw);
      tpl.attachmentExt = info.attachmentExt;
      tpl.file_extension = String(tpl.file_extension || info.file_extension || '').toLowerCase();
      tpl.attachment_filename = info.filename;
    }

    // Read phishing and landing page content
    const landingPageUrl = String(tpl.landing_page_url || '').trim();
    const isExternalLandingPageUrl = /^https?:\/\//i.test(landingPageUrl);
    const filesData = await readFiles(tpl.phishing_page_url, isExternalLandingPageUrl ? null : tpl.landing_page_url);
    logger.info('API - View Template: readFiles result keys', { 
      hasPhishing: !!filesData.phishing_page?.content,
      hasLanding: !!filesData.landing_page?.content 
    });

    tpl.phishing_page_content = filesData.phishing_page?.content || '';
    tpl.landing_page_content = filesData.landing_page?.content || '';
    tpl.landing_page_option = isExternalLandingPageUrl ? 'url' : 'html';
    tpl.landing_page_external_url = isExternalLandingPageUrl ? landingPageUrl : '';

    // Enforce exactly one slash after bucket root to avoid malformed .../o... paths.
    const webBucketRoot = (process.env.WEB_TEMPLATE_BUCKET || '').replace(/\/+$/, '');
    if (webBucketRoot) {
      ['phishing_content', 'phishing_page_content', 'landing_page_content'].forEach(field => {
        if (tpl[field] && tpl[field].includes('<%=web_bucket%>')) {
          tpl[field] = tpl[field]
            .split('<%=web_bucket%>/').join(`${webBucketRoot}/`)
            .split('<%=web_bucket%>').join(`${webBucketRoot}/`);
        }
      });
    }

    // Log what content fields are available
    logger.info('API - View Template: content availability', {
      phishing_content: !!tpl.phishing_content,
      phishing_page_content: !!tpl.phishing_page_content,
      landing_page_content: !!tpl.landing_page_content,
      file_attachment_path: !!tpl.file_attachment_path
    });

    // Return template data as JSON
    return res.json({
      success: true,
      message: tpl,
      data: tpl
    });

  } catch (err) {
    logger.error(`API - View Template: error fetching template`, { 
      error: err.message,
      stack: err.stack,
      response: err?.response?.data 
    });
    
    if (err?.response) {
      return res.status(err.response.status || 500).json({
        success: false,
        message: 'Error fetching template from backend',
        error: err?.response?.data
      });
    } else if (err?.request) {
      return res.status(503).json({
        success: false,
        message: 'Backend service unavailable'
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Error processing template request',
        error: err.message
      });
    }
  }
};
