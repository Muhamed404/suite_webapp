const { logger } = require("../../../logger/logger");
const getApiClient = require('../../../utility/api-client');
const enums = require("../../../contants/enum");
const he = require('he');
const backend_api_urls = require("../../../config/backend_api_urls");
const frontend_api_urls = require("../../../config/frontend_api_urls");



exports.duplicateTemplate = async (req, res) => {
  logger.info('[Duplicate System Template] Incoming POST request in duplicateTemplate');
  if (req.method !== "POST") {
    logger.warn('[Duplicate System Template] Non-POST request received');
    return res.status(405).send("Method Not Allowed");
  }

  // Build immutable payload from request body
  const payload = { ...req.body };

  logger.info(`[Duplicate System Template] Raw posted data: ${JSON.stringify(req.body, null, 2)}`);

  try {
    const clonningTemplateId = Number(req.params?.templateId || 0);
    logger.info(`[Duplicate System Template] templateId: ${clonningTemplateId}`);
    // map req.body.options -> difficulty (normalize)
    try {
      let opts = req.body.options;
      if (!Array.isArray(opts)) {
        opts = opts ? [opts] : [];
      }
      // detect numeric values
      const allNumeric = opts.length > 0 && opts.every(v => !Number.isNaN(Number(v)));
      payload.difficulty = allNumeric ? opts.map(v => Number(v)) : opts;
      // remove original options to avoid duplication
      delete payload.options;
      logger.info(`[Duplicate System Template] Mapped options -> difficulty: ${JSON.stringify(payload.difficulty)}`);
      const maxDifficulty = Math.max(...payload.difficulty);
      if (payload.phish_option === 'simple') {
        logger.info('Setting category to Simple based on phish_option');
        payload.category = enums.phishingCategories.ClickURLPhishing;
      } else if (payload.phish_option === 'data-entry') { // <-- changed to hyphen
        logger.info('Setting category to DataEntryBasedPhishing based on phish_option');
        payload.category = enums.phishingCategories.DataEntryBasedPhishing;
      } else {
        payload.category = maxDifficulty;
      }
      logger.info('Payload category set to:' + payload.category);

    } catch (mapErr) {
      logger.error('[Duplicate System Template] Error mapping options to difficulty: ' + mapErr);
      payload.difficulty = payload.difficulty || [];
    }


    // choose sender email/contact
    if (req.body.sender_contact) {
      payload.sender_email_or_contact = req.body.sender_contact;
      logger.info('[Duplicate System Template] Using sender_contact');
    } else if (req.body.sender_email) {
      payload.sender_email_or_contact = req.body.sender_email;
      logger.info('[Duplicate System Template] Using sender_email');
    }

    // Decode and clean HTML content fields
    ['landing_page_content', 'phishing_page_content', 'phishing_content'].forEach(field => {
      try {
        if (payload[field] === '<p><br></p>' || payload[field] === '<div><br></div>') {
          payload[field] = '';
        } else if (typeof payload[field] === 'string' && payload[field].trim().length > 0) {
          payload[field] = he.decode(payload[field].trim());
        } else {
          payload[field] = payload[field] || '';
        }
        logger.info(`[Duplicate System Template] ${field} length: ${payload[field].length}`);
      } catch (e) {
        logger.warn(`[Duplicate System Template] Error processing field ${field}: ${e.message}`);
        payload[field] = payload[field] || '';
      }
    });


    // Send to backend
    const apiClient = getApiClient(req);
    let url = backend_api_urls.PRODUCT_SUITE.Template.CLONE(clonningTemplateId);

    logger.info(`[Duplicate System Template] Posting template to URL: ${url}`);
    logger.info(`[Duplicate System Template] Final payload: ${JSON.stringify(payload, null, 2)}`);

    const queryParams = {
      module: enums.ModuleNames.System_Template
    }
    // Below is for duplicate template for organization
    if (req.user.organization_id) {
      payload.organization_id = req.params?.organizationId || req.user.organization_id;
      logger.info(`[Duplicate System Template] Duplicating for organization ID: ${payload.organization_id}`);

    }
    const response = await apiClient.post(url, payload, {
      params: queryParams
    });

    logger.info(`[Duplicate System Template] Backend response: ${JSON.stringify(response.data)}`);

    if (response.data.success) {
      req.flash('message', 'Template duplicated successfully');
      req.flash('alertType', 'success');
    } else {
      req.flash('message', 'Failed to duplicate template');
      req.flash('alertType', 'error');
    }
    if (req.user.organization_id) {
      return res.redirect(frontend_api_urls.PHISHMAGNUS.Template.LIST);

    } else {
      return res.redirect(frontend_api_urls.PRODUCT_SUITE.System_Template.LIST);
    }

  } catch (error) {
    logger.error('Error - Duplicate Template', error);
    logger.error(error.stack);
    req.flash('message', 'Failed to duplicate template');
    req.flash('alertType', 'error');
    if (req.user.organization_id) {
      return res.redirect(frontend_api_urls.PHISHMAGNUS.Template.LIST);

    } else {
      return res.redirect(frontend_api_urls.PRODUCT_SUITE.System_Template.LIST);
    }

  }
};

