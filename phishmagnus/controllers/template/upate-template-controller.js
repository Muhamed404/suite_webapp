const { logger } = require("../../../logger/logger");
const getApiClient = require('../../../utility/api-client');
const enums = require("../../../contants/enum");
const he = require('he');
const backend_api_urls = require("../../../config/backend_api_urls");
const frontend_api_urls = require("../../../config/frontend_api_urls");

exports.updateTemplateController = async (req, res) => {
  logger.info('Controller - Update Template: Incoming Request');
  if (req.method !== "POST") {
    logger.warn('Controller - Update Template: Non-POST request received');
    return res.status(405).send("Method Not Allowed");
  }

  // Build immutable payload from request body
  const payload = { ...req.body };

  logger.info(`Controller - Update Template: Raw posted data: ${JSON.stringify(req.body, null, 2)}`);

  try {
    const templateId = Number(req.params.templateId || 0);
    const isNewTemplate = templateId === 0;
    logger.info(`Controller - Update Template: templateId: ${templateId}, isNewTemplate: ${isNewTemplate}`);

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
      logger.info(`Controller - Update Template: Mapped options -> difficulty: ${JSON.stringify(payload.difficulty)}`);
      const maxDifficulty = Math.max(...payload.difficulty);
      if (payload.phish_option === 'simple') {
        payload.category = enums.phishingCategories.ClickURLPhishing
      } else if (payload.phish_option === 'data_entry') {
        payload.category = enums.phishingCategories.DataEntryBasedPhishing
      } else {
        payload.category = maxDifficulty;
      }
      logger.info('Payload category set to:' + payload.category);

    } catch (mapErr) {
      logger.error('Controller - Update Template: Error mapping options to difficulty: ' + mapErr);
      payload.difficulty = payload.difficulty || [];
    }

    // choose sender email/contact
    if (req.body.sender_contact) {
      payload.sender_email_or_contact = req.body.sender_contact;
      logger.info('Controller - Update Template: Using sender_contact');
    } else if (req.body.sender_email) {
      payload.sender_email_or_contact = req.body.sender_email;
      logger.info('Controller - Update Template: Using sender_email');
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
        logger.info(`[Create System Template] ${field} length: ${payload[field].length}`);
      } catch (e) {
        logger.warn(`[Create System Template] Error processing field ${field}: ${e.message}`);
        payload[field] = payload[field] || '';
      }
    });

    // Optionally inject interaction script for DataEntryBasedPhishing when creating a new template
    if (
      payload.phishing_page_content &&
      payload.phishing_page_content.length > 0 &&
      payload.category == enums.phishingCategories.DataEntryBasedPhishing &&
      isNewTemplate
    ) {
      logger.info('Controller - Update Template: Adding interaction script to phishing_page_content');
      payload.phishing_page_content += interactionScript();
    }
    payload.organizationId = req.user.organization_id;
    // Send to backend
    const apiClient = getApiClient(req);
    const url = backend_api_urls.PRODUCT_SUITE.Template.PHM_UPDATE(templateId);
    logger.info(`Controller - Update Template: Posting template to URL: ${url}`);
    logger.debug(`Controller - Update Template: Final payload: ${JSON.stringify(payload)}`);

    const response = await apiClient.post(url, payload);
    logger.info(`Controller - Update Template: Backend response: ${JSON.stringify(response.data)}`);
    if (response.data.success) {
      req.flash('message', req.__('system_template.save_success'));
      req.flash('alertType', 'success');
      return res.redirect(frontend_api_urls.PHISHMAGNUS.Template.LIST);
    } else {
      req.flash('message', req.__('system_template.create.errorMessage'));
      req.flash('alertType', 'error');
      return res.redirect(frontend_api_urls.PHISHMAGNUS.Template.LIST);
    }


  } catch (error) {
    logger.error('Controller - Update Template: Error:', error);
    logger.error(error.stack);
    
    if (error.response && error.response.status === 403) {
      const errorMessage = error.response.data?.message || 'Access Denied';
      logger.warn(`[Update Template] Access denied: ${errorMessage}`);
      
      if (errorMessage.toLowerCase().includes('subscription')) {
        // Subscription error - redirect to home with message
        if (req.session) {
          req.flash('message', 'You do not have an active subscription to update templates.');
          req.flash('alertType', 'error');
        }
        return res.redirect(frontend_api_urls.PHISHMAGNUS.Home.INDEX);
      }
    }
    
    // Handle other errors
    if (req.session) {
      req.flash('message', req.__('system_template.create.errorMessage'));
      req.flash('alertType', 'error');
    }
    return res.redirect(frontend_api_urls.PHISHMAGNUS.Template.LIST);

  }
};
function interactionScript() {
  const script = `
  <script>
    (function() {

      const TRACK_URL = "<%- phishing_url %>";
  let interactionSent = false; // <-- ensures firing only once

  function sendInteraction(data) {
    if (interactionSent) return; // stop duplicates
    interactionSent = true;

    fetch(TRACK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        pageUrl: window.location.href,
        ...data
      })
    }).catch(err => console.error("Tracking Error:", err));
  }

  // Detect first typing on ANY input, textarea, or content-editable
  function handleTyping() {
    sendInteraction({
      eventType: "typing_start"
    });

    // Remove listeners after first trigger
    document.removeEventListener("keydown", handleTyping);
    document.removeEventListener("input", handleTyping);
  }

  // Detect first copy attempt
  function handleCopy() {
    sendInteraction({
      eventType: "copy_attempt"
    });

    document.removeEventListener("copy", handleCopy);
  }

  // Add listeners
  document.addEventListener("keydown", handleTyping);
  document.addEventListener("input", handleTyping);
  document.addEventListener("copy", handleCopy);
})();
  </script>
  `;

  logger.info("[Create System Template] interactionScript created");
  return script;
}