const { logger } = require("../../../../logger/logger");
const enums = require("../../../../contants/enum");
const getApiClient = require('../../../../utility/api-client');
const backend_api_urls = require("../../../../config/backend_api_urls");
const render_ejs_urls = require("../../../../config/render_ejs_urls");
const frontend_api_urls = require("../../../../config/frontend_api_urls");
const { formatDateTimeDDMmmYYYYHHmmAMPM } = require('../../../../utility/date-time-utility');
const { redactLogData } = require("../../../utility/redact");

/**
 * Controller to render the email campaign details view with statistics and user details.
 */
exports.generateNFCDeviceReport = async (req, res) => {
  logger.info(`[NFC Device Report Controller]: Incoming request ${JSON.stringify(redactLogData(req.params))}`);
  // return res.render(render_ejs_urls.PhishMagnus.Campaign.QR.RENDER_TAG_REPORT);
  try {
    const nfcDeviceCode = req.params?.qrImageCode;
    const campaignId = req.params?.campaignId || 0;
    if (campaignId === undefined || campaignId === null || isNaN(campaignId) || campaignId === 0) {
      logger.warn('Invalid Campaign ID');
      req.flash('alertType', 'error');
      req.flash('message', 'Invalid Campaign ID');
      return res.redirect(frontend_api_urls.PHISHMAGNUS.Home.INDEX);
    } else if (!nfcDeviceCode || typeof nfcDeviceCode !== 'string' || nfcDeviceCode.trim() === '') {
      logger.warn('Invalid NFC Device Code');
      req.flash('alertType', 'error');
      req.flash('message', 'Invalid NFC Device Code');
      return res.redirect(frontend_api_urls.PHISHMAGNUS.Home.INDEX);
    }

    const apiClient = getApiClient(req);
    const url = backend_api_urls.PHISHMAGNUS.CAMPAIGN.NFC.TAG_REPORT(campaignId, nfcDeviceCode);
    logger.info('Initiation NFC Device Report Controller: Request' + url);
    const response = await apiClient.get(url);
    logger.info('[NFC Device Report Controller]: Response: ' + JSON.stringify(redactLogData(response.data), null, 2));

    const campaignDetails = response?.data?.message.campaignDetails || {};
    if (campaignDetails?.start_datetime) {
      campaignDetails.start_datetime = formatDateTimeDDMmmYYYYHHmmAMPM(campaignDetails.start_datetime);
    }
    logger.info(`[NFC Device Report Controller]: Campaign Details: ${JSON.stringify(redactLogData(campaignDetails), null, 2)}`);
    const interactionStats = response?.data?.message.interactionStats || {};
    logger.info(`[NFC Device Report Controller]: Interaction Stats: ${JSON.stringify(redactLogData(interactionStats), null, 2)}`);
    const nfcReportProfile = response?.data?.message.nfcReportProfile || {};
    logger.info(`[NFC Device Report Controller]: NFC Report Profile: ${JSON.stringify(redactLogData(nfcReportProfile), null, 2)}`);
    // Transform interaction stats into timeline format
    const interactionTimeline = transformInteractionStatsTimeline(nfcReportProfile, req);
    logger.info(`[NFC Device Report Controller]: Interaction Timeline: ${JSON.stringify(redactLogData(interactionTimeline), null, 2)}`);

    // Extract nfc_report_details for the per-IP timeline chart
    const nfcReportDetails = nfcReportProfile?.NFCReport?.[0]?.nfc_report_details || [];
    logger.info(`[NFC Device Report Controller]: NFC Report Details: ${JSON.stringify(redactLogData(nfcReportDetails), null, 2)}`);

    return res.render(render_ejs_urls.PhishMagnus.Campaign.NFC.RENDER_TAG_REPORT, {
      interactionStats,
      campaignDetails,
      nfcReportProfile,
      interactionTimeline,
      nfcReportDetails
    });

  } catch (error) {
    logger.error('[NFC Device Report Controller]: Error in fetching NFC Device Report Controller');
    logger.error(`${error.message}`);
    logger.error(error);
    logger.error(error.stack);
    req.flash('alertType', 'error');
    req.flash('message', 'Error in fetching NFC Device Report');
    return res.redirect(frontend_api_urls.PHISHMAGNUS.Home.INDEX);
  }
};

// Add this function to your emailUserReport.js controller
function transformInteractionStatsTimeline(nfcReportProfile, req) {
  const interactions = [];
  const nfcReport = nfcReportProfile?.QRReport?.[0];

  // QR Created
  if (nfcReport?.createdAt) {
    interactions.push({
      name: req.__('qr_report.nfc_created'),
      time: nfcReport.createdAt
    });
  }

  // NFC Scanned
  if (nfcReport?.is_opened > 0 && nfcReport?.msg_link_opened_date) {
    interactions.push({
      name: req.__('qr_report.scanned'),
      time: nfcReport.msg_link_opened_date
    });
  }

  // Interact Form
  if (nfcReport?.is_interacted > 0 && nfcReport?.form_interaction_date) {
    interactions.push({
      name: req.__('qr_report.interact_form'),
      time: nfcReport.form_interaction_date
    });
  }

  // Form Submit
  if (nfcReport?.is_submitted > 0 && nfcReport?.form_submitted_date) {
    interactions.push({
      name: req.__('qr_report.form_submit'),
      time: nfcReport.form_submitted_date
    });
  }

  // Attachment Open
  if (nfcReport?.is_downloaded > 0 && nfcReport?.file_download_date) {
    interactions.push({
      name: req.__('qr_report.attachment_open'),
      time: nfcReport.file_download_date
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
