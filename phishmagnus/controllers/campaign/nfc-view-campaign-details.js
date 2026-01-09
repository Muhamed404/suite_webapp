const config = require("../../../config/env.config");

const { logger } = require("../../../logger/logger");
const enums = require("../../../contants/enum");
const getApiClient = require('../../../utility/api-client');
const render_ejs_urls = require("../../../config/render_ejs_urls");


exports.nfcViewCampaignDetails = async (req, res) => {
  logger.info('NFC REPORT CAMPAIGN METHOD::: VIEW CAMPAIGN DETAILS')
  try {
    if (req.method === "GET") {
      let user = req.user;
      let orgId = req.params.orgId === undefined ? user.organization_id : req.params.orgId;
      let campId = req.params.campId;
      let statistics = null;
      let nfcUrls = null;
      logger.info('NFC REPORT CAMPAIGN METHOD::: ICOMING PARAMS ARE CAMP ' + campId + ' ORGANIZATION ' + orgId)
      const respStatistics = await getStatistics(req,campId, orgId);
      // logger.info(JSON.stringify(respStatistics))
      const nfcURLsResponse = await getNFCDevicesURLs(req,campId, orgId);
      if (respStatistics == null) {
        logger.info('No statistics found ')
      } else {
        statistics = respStatistics.data.message;

      }
      if (nfcURLsResponse == null) {
        logger.info('No user details found ')
      } else {
        nfcUrls = nfcURLsResponse.data.message;

      }
      logger.info('INCOMING STATISTICS ' + JSON.stringify(statistics))
      let is_opened = 0;
      let is_downloaded = 0;
      let is_submitted = 0;
      let is_interacted = 0;
      let number_of_scans = 0;
      let total_devices = statistics.total_devices;
      let statisticsDonutGraphLabels = null;
      let statisticsDonutGraphData = null;
      let statisticsDonutGraphColors = null;
      if (statistics.total_reports !== 0){ 
         is_opened = statistics.is_opened;
         is_downloaded = statistics.is_downloaded;
         is_submitted = statistics.is_submitted;
         is_interacted = statistics.is_interacted;
         number_of_scans = statistics.number_of_scans;

        statisticsDonutGraphLabels = ["Downloaded","Submit Data", "Interacted", "Open", "Scanned"];
        statisticsDonutGraphData = [is_downloaded,is_submitted, is_interacted, is_opened, number_of_scans]
        statisticsDonutGraphColors = ["#F13C6E","#F13C6E", "#cb2a2a", "#33b86c", "#ebc142" ];
      }else{
        statisticsDonutGraphLabels = ["Total UnScanned"];
        statisticsDonutGraphData = [total_devices]
        statisticsDonutGraphColors = ["#F13C6E" ];
      }
      //let phishingFormSubmitted = statistics.is_phish_msg_data_entered_submited_in_form;
      // Below information if for donut pie chart and Employees Phishing Segments
      
       
      // const reportingPhishingChartLabels = ["Email Open,Reported", "Email Open,Not Reported", "Email Not Open,Reported"];
      // const reportingPhishingChartDatas = [20, 30, 15];
      // const reportingPhishingChartColors = ["#ebc142", "#cb2a2a", "#33b86c",];

      // statisticsDonutGraphData.forEach((value, index) => {
      //   console.log(`Value ${index + 1}: ${value}`);
      // });
      const tvbs_backend_url = config.BACKEND_NFC_TVBS_URL;
      return res.render(render_ejs_urls.PhishMagnus.Campaign.NFC.VIEW, {
        statistics, nfcUrls,
        statisticsDonutGraphLabels,
        statisticsDonutGraphData,
        statisticsDonutGraphColors,
        tvbs_backend_url
        // reportingPhishingChartLabels,
        // reportingPhishingChartDatas,
        // reportingPhishingChartColors
      });
    }
  } catch (error) {
    logger.error('NFC REPORT CAMPAIGN METHOD::: EXCEPTION REPORT STARTED')
    logger.error(`${error.message}`);
    logger.error(error);
    logger.error(error.stack);
    res.redirect("/phm/?message=ERROR IN REPORT&alertType=error");
  }
};




async function getStatistics(req, campId, orgId) {
  try {
    logger.info('GET NFC CAMPAIGN STATISCS BY CAMPAIGN::: CALLING CAMPAIGN STATISTICS API')
    const apiClient = getApiClient(req);
    let url = `/phm/campaign/nfc/view/statistics/${campId}/${orgId}`;
    logger.info('URL for campaign statistics ' + url);
    const response = await apiClient.get(url);
    if (response == null) {
      logger.info('GET NFC CAMPAIGN STATISCS BY CAMPAIGN::: RESPOSE IS NULL')
      return null
    } else {
      return response;

    }
  } catch (error) {
    logger.error(`GET NFC CAMPAIGN STATISCS BY CAMPAIGN::: ERROR IN FETCHING ` + error.message);
    logger.error(error.stack);
    return null;
  }
}

async function getNFCDevicesURLs(req, campId, orgId) {
  try {
    logger.info('GET NFC DEVICES PHISHING CAMPAIGN::: CALLING CAMPAIGN PHISHING USER DETAILS API')
    let url = `/phm/campaign/nfc/devices/url/${campId}/${orgId}`;
    const apiClient = getApiClient(req);
    logger.info('URL NFC DEVICES ' + url);
    const response = await apiClient.get(url);
    if (response == null) {
      logger.info('GET NFC DEVICES::: RESPOSE IS NULL')
      return null
    } else {
      return response;

    }
  } catch (error) {
    logger.error(`ERROR IN NFC DEVICES ` + error.message);
    logger.error(error.stack);
    return null;
  }
}