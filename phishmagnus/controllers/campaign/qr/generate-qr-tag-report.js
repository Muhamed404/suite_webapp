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
    // Transform interaction stats into timeline format
    const interactionTimeline = transformInteractionStatsTimeline(qrReportProfile, req);
    logger.info(`[QR Tag Report]: Interaction Timeline: ${JSON.stringify(interactionTimeline, null, 2)}`);

    return res.render(render_ejs_urls.PhishMagnus.Campaign.QR.RENDER_TAG_REPORT, {
      interactionStats,
      campaignDetails,
      qrReportProfile,
      interactionTimeline // Pass timeline separately for easier access
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

// Add this function to your emailUserReport.js controller
function transformInteractionStatsTimeline(qrReportProfile, req) {
  const interactions = [];
  const qr = qrReportProfile?.QRReport?.[0];

  // QR Created
  if (qrReportProfile?.createdAt) {
    interactions.push({
      name: req.__('qr_report.qr_created'),
      time: qrReportProfile.createdAt
    });
  }

  // QR Scanned
  if (qr?.is_opened > 0 && qr?.msg_link_opened_date) {
    interactions.push({
      name: req.__('qr_report.qr_scanned'),
      time: qr.msg_link_opened_date
    });
  }

  // Interact Form
  if (qr?.is_interacted > 0 && qr?.form_interaction_date) {
    interactions.push({
      name: req.__('qr_report.interact_form'),
      time: qr.form_interaction_date
    });
  }

  // Form Submit
  if (qr?.is_submitted > 0 && qr?.form_submitted_date) {
    interactions.push({
      name: req.__('qr_report.form_submit'),
      time: qr.form_submitted_date
    });
  }

  // Attachment Open
  if (qr?.is_downloaded > 0 && qr?.file_download_date) {
    interactions.push({
      name: req.__('qr_report.attachment_open'),
      time: qr.file_download_date
    });
  }

  // Sort by time (earliest first), null times go to end
  return interactions.sort((a, b) => {
    if (!a.time && !b.time) return 0;
    if (!a.time) return 1;
    if (!b.time) return -1;
    return new Date(a.time) - new Date(b.time);
  });
}
