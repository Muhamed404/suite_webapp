const { logger } = require("../../logger/logger");
const enums = require("../../contants/enum");
const LicenseService = require("../../productsuite/services/license/licenseService");
const moment = require('moment');
const getApiClient = require('../../utility/api-client');
const { redactLogData } = require("../../utility/redact");
const FrontEndApiUrl = require('../../config/frontend_api_urls');
const BACKEND_API_URL = require("../../config/backend_api_urls");
const RENDER_PAGE_URLS = require('../../config/render_ejs_urls');


exports.dashboard = async (req, res, next) => {
  // logger.info(`Inside home controller index \n ${JSON.stringify(req.session)}`);
  logger.info(`[PHM Home]: Home controller has been called`);
  const user = req?.session?.user || null;
  let ISGlobalDashboard = user?.organization_id ? Boolean(false) : Boolean(true)
  logger.info(`[PHM Home]: Incoming session ISGlobalDashboard ${ISGlobalDashboard}`);
  let respPhishMagnusLicenseDetails = null;
  let hideCommonContactAndLicenseExpiry = false;
  let statisticsUrl = BACKEND_API_URL.PHISHMAGNUS.DASHBOARD_STATISTICS;
  const apiClient = getApiClient(req);
  logger.info(`[PHM Home]: Calling API ` + statisticsUrl);

  respPhishMagnusLicenseDetails = await LicenseService.retrieveSuiteManagementLicenseInformation(req);
  logger.info('[PHM Home]: Phishmganus License Details ' + JSON.stringify(redactLogData(respPhishMagnusLicenseDetails), null, 2))
  const phishMagnusLicense = respPhishMagnusLicenseDetails?.PhishMagnus?.Subscription ?? null;


  apiClient.get(statisticsUrl)
    .then((statisticsResponse) => {
      // console.log(statisticsResponse.data.message);
      logger.info('[PHM Home]: statisticsResponse ' + JSON.stringify(redactLogData(statisticsResponse.data?.message), null, 2))
      const statistics = statisticsResponse.data?.message; // Assuming response data has the stats you need
      const totalUserPhishingTypeCategoryInteractions = statistics?.totalUserPhishingTypeCategoryInteractions || {};
      const interactionsByPhishingTypes = statistics?.interactionsByPhishingTypes;
      // const inviteesEmailSentUnSentStats = statistics?.inviteesEmailSentUnSentStats;
      // const qrCreatedAndScannedStats = statistics?.qrCreatedAndScannedStats;

      const campaignsTotalCount = statistics?.totalCampaignsCount;
      // logger.info('[PHM Home]: campaignsTotalCount ' + JSON.stringify(campaignsTotalCount, null, 2))
      const totalCampaigns = campaignsTotalCount?.totalCampaigns || 0;

      const campaignPhishingTypeCountSummary = statistics?.campaignPhishingTypeCountSummary || {};
      // logger.info('[PHM Home]: campaignPhishingTypeCountSummary ' + JSON.stringify(campaignPhishingTypeCountSummary, null, 2))

      const inviteesEmailSentUnSentStats = statistics?.inviteesEmailSentUnSentStats;
      // logger.info('[PHM Home]: inviteesEmailSentUnSentStats ' + JSON.stringify(inviteesEmailSentUnSentStats, null, 2))

      const uniqueEmailInteractionsCount = extractUniqueEmailInteractions(statistics?.uniqueEmailInteractionsCount);
      const uniqueSMSInteractionsCount = extractUniqueSMSInteractions(statistics?.fetchUniqueSMSInteractionsStats);
      const uniqueQRInteractionsCount = extractUniqueQRInteractions(statistics?.QRUniqueInteractionStatistics);
      const uniqueNFCInteractionsCount = extractUniqueNFCInteractions(statistics?.nfcUniqueInteractionCountStats);
      const uniqueWhatsappInteractionsCount = extractUniqueWhatsappInteractions(statistics?.whatsappUniqueInteractionCountStats);
      const whatsappSentUnSentCountStats = statistics?.whatsappInviteeSentCountStats || {};
      // logger.info('[PHM Home]: uniqueQRInteractionsCount ' + JSON.stringify(uniqueQRInteractionsCount, null, 2))
      const fetchSMSSentUnSentCountStats = statistics?.fetchSMSSentUnSentCountStats.smsCountData || {};

      const emailStats = campaignPhishingTypeCountSummary.email ?? null;
      const qrStats = campaignPhishingTypeCountSummary.qr ?? null;
      const usbStats = campaignPhishingTypeCountSummary.usb ?? null;
      const nfcStats = campaignPhishingTypeCountSummary.nfc ?? null;
      const smsStats = campaignPhishingTypeCountSummary.sms ?? null;
      const whatsappStats = campaignPhishingTypeCountSummary.sms ?? null;

      const phmConsumedUserLicense = phishMagnusLicense.TotalUserLicense - phishMagnusLicense.TotalAvailable;
      const phmTotalPurchaseUserLicense = phishMagnusLicense.TotalUserLicense

      return res.render(RENDER_PAGE_URLS.PhishMagnus.PRODUCT_DASHBOARD, {
        phmTotalPurchaseUserLicense,
        phmConsumedUserLicense,

        lastCampaignDate: campaignsTotalCount?.lastCampaignDate || null,
        totalCampaigns,
        qrStats, emailStats, usbStats, nfcStats, smsStats, whatsappStats,
        totalUserPhishingTypeCategoryInteractions,
        emailInteractions: interactionsByPhishingTypes.email,
        uniqueEmailInteractionsCount: uniqueEmailInteractionsCount,
        inviteesEmailSentUnSentStats,
        
        // qrInteractions: interactionsByPhishingTypes.qr,
        nfcInteractions: interactionsByPhishingTypes.nfc,
        qrCreatedAndScannedStats: statistics?.qrCreatedAndScannedStats,
        nfcCreatedAndScannedStats: statistics?.nfcCreatedAndScannedStats,

        uniqueSMSInteractionsCount: uniqueSMSInteractionsCount,
        smsSentUnSentCount: fetchSMSSentUnSentCountStats,

        uniqueQRInteractionsCount: uniqueQRInteractionsCount,
        uniqueNFCInteractionsCount: uniqueNFCInteractionsCount,

        uniqueWhatsappInteractionsCount: uniqueWhatsappInteractionsCount,
        whatsappSentUnSentCount: whatsappSentUnSentCountStats,

        usbTotalCreated: statistics?.totalUSBDevicesCount || 0,
        usbTotalInteracted: statistics?.totalUSBUniqueInteractionsCount || 0,
      });
    })
    .catch((error) => {
      logger.error(`INDEX CONTROLLER::: Issue in fetching statistics: ${error.message}`);
      res.redirect(FrontEndApiUrl.LOGIN.PHISHMAGNUS)
    });
}


function extractUniqueEmailInteractions(interactionsCount) {
  logger.info('[PHM Home]: extractUniqueEmailInteractions interactionsCount ' + JSON.stringify(redactLogData(interactionsCount), null, 2))
  return {
    openEmail: interactionsCount?.is_phish_msg_opened || 0,
    linkOpened: interactionsCount?.is_phish_msg_link_opened || 0,
    fileDownloaded: interactionsCount?.is_phish_msg_file_downloaded || 0,
    dataEnteredInForm: interactionsCount?.is_phish_msg_data_entered_in_form || 0,
    dataEnteredSubmittedInForm: interactionsCount?.is_phish_msg_data_entered_submited_in_form || 0,
    reportedToAdmin: interactionsCount?.is_phish_msg_reported_to_admin || 0
  }
}


function extractUniqueSMSInteractions(interactionsCount) {
  logger.info('[PHM Home]: extractUniqueSMSInteractions interactionsCount ' + JSON.stringify(redactLogData(interactionsCount), null, 2))
  return {
    deliveredSMS: interactionsCount?.is_sms_delivered || 0,
    linkClicked: interactionsCount?.is_link_clicked || 0,
    pageVisited: interactionsCount?.is_page_visited || 0,
    formInteracted: interactionsCount?.is_form_interacted || 0,
    formSubmitted: interactionsCount?.is_form_submitted || 0,
    fileDownloaded: interactionsCount?.is_file_downloaded || 0
  }
}



function extractUniqueQRInteractions(interactionsCount) {
  logger.info('[PHM Home]: extractUniqueQRInteractions interactionsCount ' + JSON.stringify(redactLogData(interactionsCount), null, 2))
  return {
    scan: interactionsCount?.is_opened || 0,
    fileDownloaded: interactionsCount?.is_downloaded || 0,
    formSubmitted: interactionsCount?.is_submitted || 0,
    formInteracted: interactionsCount?.is_interacted || 0
  }
}



function extractUniqueNFCInteractions(interactionsCount) {
  logger.info('[PHM Home]: extractUniqueNFCInteractions interactionsCount ' + JSON.stringify(redactLogData(interactionsCount), null, 2))
  return {
    scan: interactionsCount?.is_opened || 0,
    fileDownloaded: interactionsCount?.is_downloaded || 0,
    formSubmitted: interactionsCount?.is_submitted || 0,
    formInteracted: interactionsCount?.is_interacted || 0
  }
}


function extractUniqueWhatsappInteractions(interactionsCount) {
  logger.info('[PHM Home]: extractUniqueWhatsappInteractions interactionsCount ' + JSON.stringify(redactLogData(interactionsCount), null, 2))
  return {
    open: interactionsCount?.is_whatsapp_opened || 0,
    clickLink: interactionsCount?.is_link_clicked || 0,
    pageVisited: interactionsCount?.is_page_visited || 0,
    formInteracted: interactionsCount?.is_form_interacted || 0,
    formSubmitted: interactionsCount?.is_form_submitted || 0,
    fileDownloaded: interactionsCount?.is_file_downloaded || 0

  }
}
