const config = require("../../../../config/env.config");
const { logger } = require("../../../../logger/logger");
const enums = require("../../../../contants/enum");
const getApiClient = require('../../../../utility/api-client');
const backend_api_urls = require("../../../../config/backend_api_urls");
const render_ejs_urls = require("../../../../config/render_ejs_urls");

/**
 * Controller to render the email campaign details view with statistics and user details.
 */
exports.viewCampaignDetails = async (req, res) => {
  logger.info('Email Campaign Detail: VIEW CAMPAIGN DETAILS');
  try {


    const campId = req.params?.campId || 0;
    if (campId === 0) {
      logger.warn('Email Campaign Detail: INVALID CAMP ID');
      req.flash('alertType', 'error');
      req.flash('message', 'Invalid email campaign');
      return res.redirect("/phm/index");
    }

    logger.info(`Email Campaign Detail: incoming params ${JSON.stringify(req.params, null, 2)}`);

    // Function to fetch campaign statistics
    // Fetch statistics and user details in parallel for performance
    const [campaignReportDetails, respPhishingUserDetails] = await Promise.all([
      fetchCampaignTemplateAndReportStats(req, campId),
      getPhishingUserDetailsByCampaign(req, campId)
    ]);

    logger.info('Email Campaign Detail: FETCH CAMPAIGN STATISTICS AND PHISHING USER DETAILS API CALL COMPLETED');
    logger.info(`Email Campaign Detail: respStatistics ${JSON.stringify(campaignReportDetails?.data, null, 2)}`);
    const campaignDetails = campaignReportDetails?.data?.message.campaign || {};
    // const campaignInvitees = campaignReportDetails?.data?.message.invitees || [];
    const sentUnSentStats = campaignReportDetails?.data?.message.sentUnSentStats || {};
    const campaignInteractionStats = campaignReportDetails?.data?.message.interactionStatsByCampaign || {};
    const emailOpenAndReportStats = campaignReportDetails?.data?.message.emailOpenAndReportStats || {};
    const emailClickSegmentStats = campaignReportDetails?.data?.message.emailClickSegmentStats || {};
    const emailFormSegmentStats = campaignReportDetails?.data?.message.emailFormSegmentStats || {};
    const emailAttachmentSegmentStats = campaignReportDetails?.data?.message.emailAttachmentSegmentStats || {};
    const campaignStats = {
      totalCampaignUsers: sentUnSentStats?.sentCount + sentUnSentStats?.unsentCount,
      sentUnSentStats,
      campaignInteractionStats,
      emailOpenAndReportStats,
      emailClickSegmentStats,
      emailFormSegmentStats,
      emailAttachmentSegmentStats
    }

    const usersDetail = respPhishingUserDetails?.data?.message || [];
    logger.info('respPhishingUserDetails: user Details ' + JSON.stringify(usersDetail, null, 2));

    logger.info('Email Campaign Detail: campaignStats: ' + JSON.stringify(campaignStats, null, 2));
    return res.render(render_ejs_urls.PhishMagnus.Campaign.Email.VIEW_CAMPAIGN, {
      campaignStats,
      campaignDetails,
      usersDetail
    });


  } catch (error) {
    logger.error('Email Campaign Detail: EXCEPTION REPORT STARTED');
    logger.error(`${error.message}`);
    logger.error(error);
    logger.error(error.stack);
    res.redirect("/phm/?message=ERROR IN REPORT&alertType=error");
  }
};

async function fetchCampaignTemplateAndReportStats(req, campId) {
  try {
    logger.info('GET CAMPAIGN STATISTICS BY CAMPAIGN::: CALLING CAMPAIGN STATISTICS API');
    const apiClient = getApiClient(req);
    const url = backend_api_urls.PHISHMAGNUS.CAMPAIGN.EMAIL.VIEW_EMAIL_CAMPAIGN_DETAILS_STATS(campId);
    logger.info('URL for campaign statistics: ' + url);
    const response = await apiClient.get(url);
    if (!response) {
      logger.info('GET CAMPAIGN STATISTICS BY CAMPAIGN::: RESPONSE IS NULL');
      return null;
    }
    return response;
  } catch (error) {
    logger.error(`Error in fetching campaign statistics: ${error.message}`);
    logger.error(error.stack);
    return null;
  }
}

/**
 * Fetch phishing user details by campaign ID.
 */
async function getPhishingUserDetailsByCampaign(req, campId) {
  try {
    logger.info('GET PHISHING CAMPAIGN::: CALLING CAMPAIGN PHISHING USER DETAILS API');
    const apiClient = getApiClient(req);
    const url = backend_api_urls.PHISHMAGNUS.CAMPAIGN.EMAIL.PHISHING_USER_DETAIL(campId);
    logger.info('URL for phishing user details: ' + url);
    const response = await apiClient.get(url);
    if (!response) {
      logger.info('GET PHISHING CAMPAIGN::: RESPONSE IS NULL');
      return null;
    }
    return response;
  } catch (error) {
    logger.error(`ERROR IN PHISHING USERS: ${error.message}`);
    logger.error(error.stack);
    return null;
  }
}


