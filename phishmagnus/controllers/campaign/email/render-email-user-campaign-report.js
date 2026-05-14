const config = require("../../../../config/env.config");
const { logger } = require("../../../../logger/logger");
const { redactLogData } = require("../../../utility/redact");
const enums = require("../../../../contants/enum");
const getApiClient = require('../../../../utility/api-client');
const backend_api_urls = require("../../../../config/backend_api_urls");
const render_ejs_urls = require("../../../../config/render_ejs_urls");
const frontend_api_urls = require("../../../../config/frontend_api_urls");

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
    
    // Transform interaction stats into timeline format
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
  
  // Email Sent - use creation date or a default sent time
  if (sentUnSentStats?.sentCount > 0) {
    interactions.push({
      name: "Email Sent",
      time: sentUnSentStats.sentDate || new Date().toISOString() // Use actual sent date if available
    });
  }
  
  // Email Open
  if (campaignInteractionStats.is_phish_msg_opened > 0 && campaignInteractionStats.msg_opened_date) {
    interactions.push({
      name: "Email Open",
      time: campaignInteractionStats.msg_opened_date
    });
  }
  
  // Clicked Link
  if (campaignInteractionStats.is_phish_msg_link_opened > 0 && campaignInteractionStats.msg_link_opened_date) {
    interactions.push({
      name: "Clicked Link",
      time: campaignInteractionStats.msg_link_opened_date
    });
  }
  
  // Interact Form (data entered in form)
  if (campaignInteractionStats.is_phish_msg_data_entered_in_form > 0 && campaignInteractionStats.msg_data_entered_date) {
    interactions.push({
      name: "Interact Form",
      time: campaignInteractionStats.msg_data_entered_date
    });
  }
  
  // Form Submit
  if (campaignInteractionStats.is_phish_msg_data_entered_submited_in_form > 0 && campaignInteractionStats.msg_data_submitted_date) {
    interactions.push({
      name: "Form Submit",
      time: campaignInteractionStats.msg_data_submitted_date
    });
  }
  
  // Attachment Open/Download
  if (campaignInteractionStats.is_phish_msg_file_downloaded > 0 && campaignInteractionStats.msg_file_downloaded_date) {
    interactions.push({
      name: "Attachment Open",
      time: campaignInteractionStats.msg_file_downloaded_date
    });
  }
   
  
  // Reported to Admin
  if (campaignInteractionStats.is_phish_msg_reported_to_admin > 0 && campaignInteractionStats.msg_reported_to_admin_date) {
    interactions.push({
      name: "Reported Admin",
      time: campaignInteractionStats.msg_reported_to_admin_date
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

