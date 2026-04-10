const config = require("../../../../config/env.config");
const { logger } = require("../../../../logger/logger");
const enums = require("../../../../contants/enum");
const getApiClient = require('../../../../utility/api-client');
const backend_api_urls = require("../../../../config/backend_api_urls");
const render_ejs_urls = require("../../../../config/render_ejs_urls");
const frontend_app_urls = require('../../../../config/frontend_api_urls');
const frontend_api_urls = require("../../../../config/frontend_api_urls");
const ApplicationConstants = require('../../../../contants/application-constants')
const moment = require('moment');
/**
 * Controller to render the NFC campaign details view with statistics and user details.
 */
exports.viewNFCCampaignDetails = async (req, res) => {
  logger.info(`NFC Campaign Detail: incoming params ${JSON.stringify(req.params, null, 2)}`);
  try {
    // return res.render(render_ejs_urls.PhishMagnus.Campaign.NFC.VIEW_CAMPAIGN);

    const campaignId = Number(req.params?.campId) || 0;

    if (campaignId === undefined || campaignId === null || isNaN(campaignId) || campaignId === 0) {

      logger.warn('NFC Campaign Detail: INVALID CAMPAIGN ID');
      req.flash('alertType', 'error');
      req.flash('message', 'Error in loading NFC campaign details');
      return res.redirect(frontend_app_urls.PHISHMAGNUS.Home.INDEX);
    }



    // Function to fetch campaign statistics
    // Fetch statistics and user details in parallel for performance
    const [apiResponseCampaignReport] = await Promise.all([
      generateReport(req, campaignId),
    ]);

    logger.info('NFC Campaign Detail: FETCHED ALL DATA');
    logger.info(`NFC Campaign Report: ${JSON.stringify(apiResponseCampaignReport?.data, null, 2)}`);


    const campaignDetails = apiResponseCampaignReport?.data?.message.campaign || {};
    logger.info(`NFC Campaign Detail: campaignDetails: ${JSON.stringify(campaignDetails, null, 2)}`);
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
    const scannedNotScannedStats = apiResponseCampaignReport?.data?.message.scannedNotScannedStats || {};


    let nfcDevices = apiResponseCampaignReport?.data?.message.nfcTagScanReport || [];

    // logger.info(`Parsed qrImageUrls: ${JSON.stringify(qrImageUrls, null, 2)}`);

    if (!nfcDevices || nfcDevices.length === 0) {
      logger.warn(`No NFC Devices found for campaign ID: ${campaignId}`);
      nfcDevices = [];
    } else {
      nfcDevices = nfcDevices.map(device => ({
        ...device,
        download_url: ApplicationConstants.BACKEND_TVBS_URL + ApplicationConstants.TVB_Main_Routes.NFC +`?`+ ApplicationConstants.TVB_Query_Params.NFC_Device_Code + `=${device.nfc_code}&` + ApplicationConstants.TVB_Query_Params.Campaign_Id + `=${campaignId}`
      }));
      nfcDevices.forEach(device => logger.info(`NFC Device download_url: ${device.download_url}`));
    }

    logger.info('NFC Campaign Detail: campaignStats: ' + JSON.stringify(campaignStats, null, 2));
    return res.render(render_ejs_urls.PhishMagnus.Campaign.NFC.VIEW, {
      campaignDetails,
      templateDetails,
      campaignStats,
      openSegmentStats,
      downloadSegmentStats,
      formSubmittedSegmentStats,
      formInteractionSegmentStats,
      scannedNotScannedStats,
      nfcDevices,
      // qrImageUrls,

    });


  } catch (error) {
    logger.error('Error in rendering NFC Campaign Details view');
    logger.error(`${error.message}`);
    logger.error(error.stack);
    req.flash('alertType', 'error');
    req.flash('message', 'Error in loading NFC campaign details');
    return res.redirect(frontend_app_urls.PHISHMAGNUS.Home.INDEX);
  }
};

async function generateReport(req, campId) {
  try {

    const apiClient = getApiClient(req);
    const url = backend_api_urls.PHISHMAGNUS.CAMPAIGN.NFC.CAMPAIGN_REPORT_DETAILS(campId);
    logger.info('Start Fetching NFC Campaign Report Details: ' + url);
    const response = await apiClient.get(url);
    if (!response) {
      logger.info('NFC Campaign Report Details: RESPONSE IS NULL');
      return null;
    }
    return response;
  } catch (error) {
    logger.error(`Error in NFC Campaign Report Details: ${error.message}`);
    logger.error(error.stack);
    throw error;
  }
}


// Get NFC Image URLs
async function retrieveNFCDevices(req, campId) {
  try {
    let url = backend_api_urls.PHISHMAGNUS.CAMPAIGN.NFC.RETRIEVE_NFC_DEVICES_BY_CAMPAIGN(campId);
    const apiClient = getApiClient(req);
    logger.info('Start Fetching NFC Images: ' + url);
    const response = await apiClient.get(url);
    // In your helper functions:
    logger.info('===== API Response from NFC images =====\n' + JSON.stringify(response?.data, null, 2));
    if (!response) {
      logger.info('GET NFC IMAGES::: RESPONSE IS NULL');
      return null;
    } else {
      return response;
    }
  } catch (error) {
    logger.error(`Error in retrieving NFC Images: ${error.message}`);
    logger.error(error.stack);
    throw error;
  }
}
