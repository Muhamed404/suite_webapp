const config = require("../../../../config/env.config");
const { logger } = require("../../../../logger/logger");
const { redactLogData } = require("../../../utility/redact");
const enums = require("../../../../contants/enum");
const getApiClient = require('../../../../utility/api-client');
const backend_api_urls = require("../../../../config/backend_api_urls");
const render_ejs_urls = require("../../../../config/render_ejs_urls");
const frontend_api_urls = require("../../../../config/frontend_api_urls");
const { formatDateTimeDDMmmYYYYHHmmAMPM } = require('../../../../utility/date-time-utility');

/**
 * Controller to render the email campaign details view with statistics and user details.
 */
exports.emailUserReport = async (req, res) => {
  logger.info(`User Email Report: Incoming request ${JSON.stringify(redactLogData(req.params))}`);
  try {
    let campaignId = parseInt(req.params?.campId, 10);
    let inviteeId = parseInt(req.params?.inviteeId, 10);

    if (!campaignId) {
      logger.warn('User Email Report: INVALID CAMP ID');
      req.flash('alertType', 'error');
      req.flash('message', 'Invalid email campaign');
      return res.redirect("/phm/index");
    } else if (!inviteeId) {
      logger.warn('User Email Report: INVALID INVITEE ID');
      req.flash('alertType', 'error');
      req.flash('message', 'Invalid invitee for email campaign');
      return res.redirect("/phm/index");
    }
   
    const apiClient = getApiClient(req);
    const url = backend_api_urls.PHISHMAGNUS.CAMPAIGN.EMAIL.USER_REPORT(inviteeId, campaignId);
    logger.info('User Email Report: url' + url);
    const response = await apiClient.get(url);
    logger.info('User Email Report: response ' + JSON.stringify(redactLogData(response.data), null, 2));
    
    const campaignDetails = response?.data?.message.campaign || {};
    const sentUnSentStats = response?.data?.message.sentUnSentStats || {};
    const campaignInteractionStats = response?.data?.message.interactionStatsByCampaign || {};
    const userProfile = response?.data?.message.userProfile || {};

    const userInteractionTimeline = transformInteractionStats(campaignInteractionStats, sentUnSentStats);
    
    const campaignStats = {
      totalCampaignUsers: sentUnSentStats?.sentCount + sentUnSentStats?.unsentCount,
      sentUnSentStats,
      campaignInteractionStats,
      userInteractionTimeline // Add the timeline data
    };

    logger.info('User Email Report: campaignStats: ' + JSON.stringify(redactLogData(campaignStats), null, 2));
    logger.info('User Email Report: userInteractionTimeline: ' + JSON.stringify(redactLogData(userInteractionTimeline), null, 2));
    
    return res.render(render_ejs_urls.PhishMagnus.Campaign.Email.USER_REPORT, {
      campaignStats,
      campaignDetails,
      userProfile,
      userInteractionTimeline, // Pass timeline separately for easier access
      inviteeId,
    });

  } catch (error) {
    logger.error('User Email Report: Error in fetching user email report');
    logger.error(`${error.message}`);
    logger.error(error);
    logger.error(error.stack);
    req.flash('alertType', 'error');
    req.flash('message', 'Error in fetching user email report');
    return res.redirect(frontend_api_urls.PHISHMAGNUS.Home.INDEX);
  }
};

// Add this function to your emailUserReport.js controller
function transformInteractionStats(campaignInteractionStats, sentUnSentStats) {
  const interactions = [];

  const pushInteraction = (name, rawTime) => {
    if (!rawTime) return;
    interactions.push({
      name,
      time: rawTime,
      displayTime: formatDateTimeDDMmmYYYYHHmmAMPM(rawTime)
    });
  };

  if (sentUnSentStats?.sentCount > 0) {
    pushInteraction('Email Sent', sentUnSentStats.sentDate || null);
  }

  if (campaignInteractionStats.is_phish_msg_opened > 0) {
    pushInteraction('Email Open', campaignInteractionStats.msg_opened_date);
  }

  if (campaignInteractionStats.is_phish_msg_link_opened > 0) {
    pushInteraction('Clicked Link', campaignInteractionStats.msg_link_opened_date);
  }

  if (campaignInteractionStats.is_phish_msg_data_entered_in_form > 0) {
    pushInteraction('Interact Form', campaignInteractionStats.msg_data_entered_date);
  }

  if (campaignInteractionStats.is_phish_msg_data_entered_submited_in_form > 0) {
    pushInteraction('Form Submit', campaignInteractionStats.msg_data_submitted_date);
  }

  if (campaignInteractionStats.is_phish_msg_file_downloaded > 0) {
    pushInteraction('Attachment Open', campaignInteractionStats.msg_file_downloaded_date);
  }

  if (campaignInteractionStats.is_phish_msg_reported_to_admin > 0) {
    pushInteraction('Reported Admin', campaignInteractionStats.msg_reported_to_admin_date);
  }

  return interactions.sort((a, b) => {
    if (!a.time && !b.time) return 0;
    if (!a.time) return 1;
    if (!b.time) return -1;
    return new Date(a.time) - new Date(b.time);
  });
}

