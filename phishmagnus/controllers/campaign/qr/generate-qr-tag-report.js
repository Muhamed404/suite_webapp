const { logger } = require("../../../../logger/logger");
const enums = require("../../../../contants/enum");
const getApiClient = require('../../../../utility/api-client');
const backend_api_urls = require("../../../../config/backend_api_urls");
const render_ejs_urls = require("../../../../config/render_ejs_urls");
const frontend_api_urls = require("../../../../config/frontend_api_urls");

/**
 * Controller to render the email campaign details view with statistics and user details.
 */
exports.generateQRTagReport = async (req, res) => {
  logger.info(`[QR Tag Report]: Incoming request ${JSON.stringify(req.params)}`);
  // return res.render(render_ejs_urls.PhishMagnus.Campaign.QR.RENDER_TAG_REPORT);
  try {
    const qrImageCode = req.params?.qrImageCode;
    const campaignId = req.params?.campaignId || 0;
    if (campaignId === undefined || campaignId === null || isNaN(campaignId) || campaignId === 0) {
      logger.warn('Invalid Campaign ID');
      req.flash('alertType', 'error');
      req.flash('message', 'Invalid Campaign ID');
      return res.redirect(frontend_api_urls.PHISHMAGNUS.Home.INDEX);
    } else if (!qrImageCode || typeof qrImageCode !== 'string' || qrImageCode.trim() === '') {
      logger.warn('Invalid QR Image Code');
      req.flash('alertType', 'error');
      req.flash('message', 'Invalid QR Image Code');
      return res.redirect(frontend_api_urls.PHISHMAGNUS.Home.INDEX);
    }

    const apiClient = getApiClient(req);
    const url = backend_api_urls.PHISHMAGNUS.CAMPAIGN.QR.TAG_REPORT(campaignId, qrImageCode);
    logger.info('Initiation QR Tag Report: Request' + url);
    const response = await apiClient.get(url);
    logger.info('[QR Tag Report]: Response: ' + JSON.stringify(response.data, null, 2));

    const campaignDetails = response?.data?.message.campaignDetails || {};
    logger.info(`[QR Tag Report]: Campaign Details: ${JSON.stringify(campaignDetails, null, 2)}`);
    const interactionStats = response?.data?.message.interactionStats || {};
    logger.info(`[QR Tag Report]: Interaction Stats: ${JSON.stringify(interactionStats, null, 2)}`);
    const qrReportProfile = response?.data?.message.qrReportProfile || {};
    logger.info(`[QR Tag Report]: QR Report Profile: ${JSON.stringify(qrReportProfile, null, 2)}`);

    const qrTagReportDetails = response.data?.message.qrTagReportDetails || [];
    logger.info(`[QR Tag Report]: QR Tag Report Details: ${JSON.stringify(qrTagReportDetails, null, 2)}`);
   
    return res.render(render_ejs_urls.PhishMagnus.Campaign.QR.RENDER_TAG_REPORT, {
      interactionStats,
      campaignDetails,
      qrReportProfile,
      qrTagReportDetails
    });

  } catch (error) {
    logger.error('[QR Tag Report]: Error in fetching QR Tag Report');
    logger.error(`${error.message}`);
    logger.error(error);
    logger.error(error.stack);
    req.flash('alertType', 'error');
    req.flash('message', 'Error in fetching QR Tag Report');
    return res.redirect(frontend_api_urls.PHISHMAGNUS.Home.INDEX);
  }
};