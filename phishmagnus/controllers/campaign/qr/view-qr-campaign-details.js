const config = require("../../../../config/env.config");
const { logger } = require("../../../../logger/logger");
const enums = require("../../../../contants/enum");
const getApiClient = require('../../../../utility/api-client');
const backend_api_urls = require("../../../../config/backend_api_urls");
const render_ejs_urls = require("../../../../config/render_ejs_urls");
const frontend_app_urls = require('../../../../config/frontend_api_urls');
const frontend_api_urls = require("../../../../config/frontend_api_urls");
const moment = require('moment');
/**
 * Controller to render the QR campaign details view with statistics and user details.
 */
exports.viewQRCampaignDetails = async (req, res) => {
  logger.info('QR Campaign Detail: VIEW CAMPAIGN DETAILS');
  logger.info(`QR Campaign Detail: incoming params ${JSON.stringify(req.params, null, 2)}`);
  try {
    // return res.render(render_ejs_urls.PhishMagnus.Campaign.QR.VIEW_CAMPAIGN);

    const campId = Number(req.params?.campId) || 0;
    if (campId === 0) {
      logger.warn('QR Campaign Detail: INVALID CAMP ID');
      req.flash('alertType', 'error');
      req.flash('message', 'Error in loading QR campaign details');
      return res.redirect(frontend_app_urls.PHISHMAGNUS.Home.INDEX);
    }



    // Function to fetch campaign statistics
    // Fetch statistics and user details in parallel for performance
    const [apiResponseCampaignReport
    ] = await Promise.all([
      generateReport(req, campId),
    ]);

    logger.info('QR Campaign Detail: FETCHED ALL DATA');
    logger.info(`QR Campaign Report: ${JSON.stringify(apiResponseCampaignReport?.data, null, 2)}`);


    const campaignDetails = apiResponseCampaignReport?.data?.message.campaign || {};
    // Format the campaign start datetime for display (avoid raw ISO string)
    try {
      if (campaignDetails && campaignDetails.start_datetime) {
        campaignDetails.start_datetime = moment(campaignDetails.start_datetime).format('DD-MMM-YYYY hh:mm A');
      }
    } catch (err) {
      logger.warn('Failed to format campaignDetails.start_datetime', err);
    }
    const templateDetails = apiResponseCampaignReport?.data?.message.campaign.Templates || {};
    const campaignStats = apiResponseCampaignReport?.data?.message.interactionStatsByCampaign || {};
    const openSegmentStats = apiResponseCampaignReport?.data?.message.openSegmentStats || {};
    const downloadSegmentStats = apiResponseCampaignReport?.data?.message.downloadSegmentStats || {};
    const formSubmittedSegmentStats = apiResponseCampaignReport?.data?.message.submittedSegmentStats || {};
    const formInteractionSegmentStats = apiResponseCampaignReport?.data?.message.interactedSegmentStats || {};
    const uniqueIpCount = apiResponseCampaignReport?.data?.message.uniqueIpCount || 0;

    let qrImageUrls = apiResponseCampaignReport?.data?.message.qrTagScanReport || [];
    logger.info(`Parsed qrImageUrls: ${JSON.stringify(qrImageUrls, null, 2)}`);

    if (!qrImageUrls || qrImageUrls.length === 0) {
      logger.warn(`No QR images found for campaign ID: ${campId}`);
      qrImageUrls = [];
    } else {
      qrImageUrls = qrImageUrls.map(img => ({
        ...img,
        download_url: frontend_api_urls.PHISHMAGNUS.Campaign.QR.DOWNLOAD_QR_URL(img.qr_code)
      }));
    }

    logger.info('QR Campaign Detail: campaignStats: ' + JSON.stringify(campaignStats, null, 2));
    return res.render(render_ejs_urls.PhishMagnus.Campaign.QR.VIEW_CAMPAIGN, {
      campaignDetails,
      templateDetails,
      campaignStats,
      openSegmentStats,
      downloadSegmentStats,
      formSubmittedSegmentStats,
      formInteractionSegmentStats,
      qrImageUrls,
      tvbs_backend_url: config.BACKEND_TVBS_URL || '',
      uniqueIpCount
    });


  } catch (error) {
    logger.error('Error in rendering QR Campaign Details view');
    logger.error(`${error.message}`);
    logger.error(error.stack);
    req.flash('alertType', 'error');
    req.flash('message', 'Error in loading QR campaign details');
    return res.redirect(frontend_app_urls.PHISHMAGNUS.Home.INDEX);
  }
};

async function generateReport(req, campId) {
  try {

    const apiClient = getApiClient(req);
    const url = backend_api_urls.PHISHMAGNUS.CAMPAIGN.QR.CAMPAIGN_REPORT_DETAILS(campId);
    logger.info('Start Fetching QR Campaign Report Details: ' + url);
    const response = await apiClient.get(url);
    if (!response) {
      logger.info('QR Campaign Report Details: RESPONSE IS NULL');
      return null;
    }
    return response;
  } catch (error) {
    logger.error(`Error in QR Campaign Report Details: ${error.message}`);
    logger.error(error.stack);
    throw error;
  }
}


// Get QR Image URLs
async function retrieveQRImage(req, campId) {
  try {
    let url = backend_api_urls.PHISHMAGNUS.CAMPAIGN.QR.RETRIEVE_QR_CODES_BY_CAMPAIGN(campId);
    const apiClient = getApiClient(req);
    logger.info('Start Fetching QR Images: ' + url);
    const response = await apiClient.get(url);
    // In your helper functions:
    logger.info('===== API Response from QR images =====\n' + JSON.stringify(response?.data, null, 2));
    if (!response) {
      logger.info('GET QR IMAGES::: RESPONSE IS NULL');
      return null;
    } else {
      return response;
    }
  } catch (error) {
    logger.error(`Error in retrieving QR Images: ${error.message}`);
    logger.error(error.stack);
    throw error;
  }
}
