const TemplateService = require('../../template/template-service');
const getApiClient = require('../../../../utility/api-client');
const backend_api_urls = require("../../../../config/backend_api_urls");
const { logger } = require("../../../../logger/logger");
const { redactLogData } = require("../../../utility/redact");

exports.fetchTemplates = async (orgId, phishingType, req) => {
  try {
    const [templateResponse, systemTemplateResponse] = await Promise.all([
      TemplateService.listTemplatesByOrgAndType(orgId, phishingType, req),
      TemplateService.getSystemTemplates(phishingType, req)
    ]);
    return {
      templates: templateResponse.data.message,
      systemTemplate: systemTemplateResponse.data.message
    };
  } catch (error) {
    logger.error("Error in fetchTemplates: " + error.message);
    throw error;
  }
};

exports.createCampaign = async (req) => {
  let payload = req.body;
  logger.info("NFC CAMPAIGN MODULE::: CREATE NFC CAMPAIGN SERVICE");
  logger.info("Payload received: " + JSON.stringify(redactLogData(payload)));
  // Basic validation
  if (payload.templateId === null || payload.templateId === undefined || payload.templateId === "") {
    logger.info('Invalid Template has passed in nfc campaign ' + payload.templateId)
    throw new Error('Invalid NFC Template Selected');
  }
 
  const apiClient = getApiClient(req);
  const url = backend_api_urls.PHISHMAGNUS.CAMPAIGN.NFC.CREATE;
  logger.info("Posting NFC Campaign URL: " + url);
  const response = await apiClient.post(url, payload);
  logger.info('NFC campaign creation response: ' + JSON.stringify(response.data));
  return response.data;
};