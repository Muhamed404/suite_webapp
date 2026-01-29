const { logger } = require("../../../logger/logger");
const getApiClient = require('../../../utility/api-client');
const enums = require("../../../contants/enum");
const he = require('he');
const backend_api_urls = require("../../../config/backend_api_urls");
const frontend_api_urls = require("../../../config/frontend_api_urls");

exports.renderCreateTemplate = async (req, res) => {
  logger.info('[System Template] Incoming GET request in renderCreateTemplate');
  try {
    const apiClient = getApiClient(req);
    const attFileTypesUrl = `/phm/commons/getAttachmentFileTypes`;
    const campaignTypesUrl = `/phm/campaign/phishing-campaign-types`;

    logger.info(`[System Template] Fetching attachment file types from: ${attFileTypesUrl}`);
    logger.info(`[System Template] Fetching campaign types from: ${campaignTypesUrl}`);

    const [resAttFileTypes, campaignTypesResponse] = await Promise.all([
      apiClient.get(attFileTypesUrl),
      apiClient.get(campaignTypesUrl)
    ]);

    logger.info(`[System Template] Attachment file types response: ${JSON.stringify(resAttFileTypes.data)}`);
    logger.info(`[System Template] Campaign types response: ${JSON.stringify(campaignTypesResponse.data)}`);

    const fileTypes = resAttFileTypes.data.filetypes || [];
    const campaignTypesData = campaignTypesResponse.data.message || [];
    const filteredData = campaignTypesData.filter(item => item.name !== "USB");

    logger.info(`[System Template] Filtered campaign types count: ${filteredData.length}`);

    res.render("pages/system_template/create-template", {
      // enableSuiteManagementLeftMenu: true,
      postMethodUrl: frontend_api_urls.PRODUCT_SUITE.System_Template.CREATE,
      fileTypes,
      campaignTypes: filteredData,
      phishTypeMap: enums.phishingType,

    });
    logger.info('[System Template] Rendered create_template page successfully');
  } catch (error) {
    logger.error('[System Template] Error in renderCreateTemplate:', error);
    logger.error(error.stack);
    res.render("pages/product_suite_management/suite_management", {
      message: "Error loading template creation page",
      alertType: "error",
    });
  }
};

exports.createTemplate = async (req, res) => {
  logger.info('[Create System Template] Incoming POST request in createTemplate');
  if (req.method !== "POST") {
    logger.warn('[Create System Template] Non-POST request received');
    return res.status(405).send("Method Not Allowed");
  }

  // Build immutable payload from request body
  const payload = { ...req.body };

  logger.info(`[Create System Template] Raw posted data: ${JSON.stringify(req.body, null, 2)}`);

  try {
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
      logger.info(`[Create System Template] Mapped options -> difficulty: ${JSON.stringify(payload.difficulty)}`);
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
      logger.error('[Create System Template] Error mapping options to difficulty: ' + mapErr);
      payload.difficulty = payload.difficulty || [];
    }
    // const value = enums.phishingType[payload.phishingType.ignoreCase] ?
    const enumObj = enums.phishingType || {};
    const matchKey = Object.keys(enumObj).find(k => k.toLowerCase() === payload.phishType.toLowerCase());
    if (matchKey) {
      payload.phishType = enumObj[matchKey];
    } else {
      // explicit fallback
      const fallback = { email: 2, sms: 1, usb: 3, whatsapp: 4, qr: 5, nfc: 6 };
      payload.phishType = fallback[payload.phishType.toLowerCase()] ?? payload.phishType;
    }
    logger.info('phishType value: ' + payload.phishType);
    if (!payload.phishType) {
      throw new Error('Invalid phishing type provided');
    }
    // choose sender email/contact
    if (req.body.sender_contact) {
      payload.sender_email_or_contact = req.body.sender_contact;
      logger.info('[Create System Template] Using sender_contact');
    } else if (req.body.sender_email) {
      payload.sender_email_or_contact = req.body.sender_email;
      logger.info('[Create System Template] Using sender_email');
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
      payload.category == enums.phishingCategories.DataEntryBasedPhishing
    ) {
      logger.info('[Create System Template] Adding interaction script to phishing_page_content');
      const scriptStart = '<script>';
      const scriptEnd = '</script>';
      const newScript = interactionScript();

      // Remove any existing interactionScript
      let content = payload.phishing_page_content;
      const scriptRegex = /<script>[\s\S]*?<\/script>/gi;
      if (scriptRegex.test(content)) {
        content = content.replace(scriptRegex, '');
      }
      payload.phishing_page_content = content + newScript;
    }

    // Send to backend
    const apiClient = getApiClient(req);
    let url = backend_api_urls.PRODUCT_SUITE.Template.CREATE;

    logger.info(`[Create System Template] Posting template to URL: ${url}`);
    logger.info(`[Create System Template] Final payload: ${JSON.stringify(payload, null, 2)}`);


    const response = await apiClient.post(url, payload);
    logger.info(`[Create System Template] Backend response: ${JSON.stringify(response.data)}`);

    // Handle backend response envelope
    req.flash('message', req.__('system_template.create.successMessage'));
    req.flash('alertType', 'success');
    return res.redirect(`${frontend_api_urls.PRODUCT_SUITE.System_Template.LIST}`);

  } catch (error) {
    logger.error('[Create System Template] Error:', error);
    logger.error(error.stack);
    const errMsg = error.response?.data?.message || 'Error saving template';
    req.flash('message', req.__('system_template.create.errorMessage'));
    req.flash('alertType', 'error');
    return res.redirect(`${frontend_api_urls.PRODUCT_SUITE.System_Template.LIST}`);

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

    console.log("[Sent Once Only]", data);
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