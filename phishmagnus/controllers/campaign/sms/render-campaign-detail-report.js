const config = require("../../../../config/env.config");
const { logger } = require("../../../../logger/logger");
const getApiClient = require('../../../../utility/api-client');
const backend_api_urls = require("../../../../config/backend_api_urls");
const frontend_api_urls = require("../../../../config/frontend_api_urls");
const render_ejs_urls = require("../../../../config/render_ejs_urls");
const { formatDateTimeDDMmmYYYYHHmmAMPM } = require('../../../../utility/date-time-utility');


/**
 * Transform campaign stats from backend response
 * @param {Object} backendStats - Stats from backend
 * @returns {Object} Formatted stats
 */
function transformCampaignStats(backendStats) {
  // Calculate delivery rate
  let deliveryRate = '0%';
  const totalSMSSent = backendStats?.smsCountData?.[0]?.totalSMSSent || 0;
  const totalDelivered = backendStats?.interactionData?.is_sms_delivered || 0;
  const totalInvitees = backendStats?.smsCountData?.[0]?.totalInvitees || 0;

  if (totalSMSSent !== 0) {
    const rate = ((totalSMSSent / totalInvitees) * 100).toFixed(2);
    deliveryRate = `${rate}%`;
  }

  return {
    totalSMSSent: totalSMSSent,
    totalDelivered: totalDelivered,
    deliveryRate: deliveryRate,
    is_link_clicked: backendStats?.interactionData?.is_link_clicked || 0,
    is_page_visited: backendStats?.interactionData?.is_page_visited || 0,
    is_form_interacted: backendStats?.interactionData?.is_form_interacted || 0,
    is_form_submitted: backendStats?.interactionData?.is_form_submitted || 0,
    is_file_downloaded: backendStats?.interactionData?.is_file_downloaded || 0,
    is_sms_replied: backendStats?.interactionData?.is_sms_replied || 0,
    is_call_made: backendStats?.interactionData?.is_call_made || 0,
    is_otp_shared: backendStats?.interactionData?.is_otp_shared || 0,
    is_sms_interacted: backendStats?.interactionData?.is_sms_interacted || 0
  };
}

/**
 * Transform invitee response data
 * @param {Array} invitees - Invitee responses from backend
 * @returns {Array} Formatted invitee responses
 */
function transformInviteeResponses(invitees) {
  return invitees.map(invitee => ({
    invitee_id: invitee.invitee_id,
    inviteeName: invitee.invitee?.name || invitee.inviteeName || 'Unknown',
    inviteeEmail: invitee.invitee?.email || invitee.inviteeEmail || 'N/A',
    is_sms_delivered: invitee.is_sms_delivered === 1 || invitee.is_sms_delivered === true,
    is_link_clicked: invitee.is_link_clicked === 1 || invitee.is_link_clicked === true,
    is_page_visited: invitee.is_page_visited === 1 || invitee.is_page_visited === true,
    is_form_interacted: invitee.is_form_interacted === 1 || invitee.is_form_interacted === true,
    is_form_submitted: invitee.is_form_submitted === 1 || invitee.is_form_submitted === true,
    is_file_downloaded: invitee.is_file_downloaded === 1 || invitee.is_file_downloaded === true,
    is_sms_replied: invitee.is_sms_replied === 1 || invitee.is_sms_replied === true,
    is_call_made: invitee.is_call_made === 1 || invitee.is_call_made === true,
    is_otp_shared: invitee.is_otp_shared === 1 || invitee.is_otp_shared === true,
    is_sms_interacted: invitee.is_sms_interacted === 1 || invitee.is_sms_interacted === true
  }));
}

/**
 * Format campaign details for template
 * @param {Object} backendCampaign - Campaign data from backend
 * @returns {Object} Formatted campaign object
 */
function formatCampaignDetails(backendCampaign) {
  return {
    id: backendCampaign?.campaign.id,
    name: backendCampaign?.campaign.name || 'Unnamed Campaign',
    template: {
      id: backendCampaign?.campaign.Templates?.id,
      name: backendCampaign?.campaign.Templates?.name || 'N/A'
    },
    campaignStatus: backendCampaign.campaignStatus || 'Pending',
    launchDate: formatDateTimeDDMmmYYYYHHmmAMPM(backendCampaign.campaign.start_datetime) || 'N/A',
    // createdAt: backendCampaign.createdAt,
    // updatedAt: backendCampaign.updatedAt,
    smsStats: transformCampaignStats(backendCampaign.interactionStatsByCampaign),
    inviteeResponses: Array.isArray(backendCampaign.inviteeResponses)
      ? transformInviteeResponses(backendCampaign.inviteeResponses)
      : []
  };
}

/**
 * Get SMS campaign details
 * GET /phm/campaign/sms/:id
 * 
 * TESTING MODE: Set USE_MOCK_DATA=true in .env to use mock data
 */
exports.getSMSCampaignDetails = async (req, res) => {
  try {
    const campaignId = parseInt(req.params.campaignId);
    const USE_MOCK_DATA = 'true';

    // Validate campaign ID
    if (isNaN(campaignId) || campaignId <= 0) {
      logger.warn(`[SMS Campaign Details] Invalid campaign ID: ${req.params.campaignId}`);
      req.flash('message', __("sms.campaign_details.invalid_id") || 'Invalid campaign ID');
      req.flash('alertType', 'error');
      return res.redirect(frontend_api_urls.PHISHMAGNUS.Campaign.SMS.LIST);
    }

    logger.info(`[SMS Campaign Details] Fetching details for campaign ID: ${campaignId}`);
    logger.info(`[SMS Campaign Details] Mock Data Mode: ${USE_MOCK_DATA}`);

    // Fetch from actual backend API
    const apiClient = getApiClient(req);

    const campaignResponse = await apiClient.get(
      backend_api_urls.PHISHMAGNUS.CAMPAIGN.SMS.VIEW(campaignId),
      {
        headers: { 'Accept': 'application/json' }
      }
    );

    logger.info(`[SMS Campaign Details] API Response Status: ${campaignResponse.status}`);
    let backendCampaign = campaignResponse?.data?.data || {};

    // Format campaign data for template
    const campaign = formatCampaignDetails(backendCampaign);

    logger.info(`[SMS Campaign Details] Campaign found: ${campaign.name}`);
    logger.info(`[SMS Campaign Details] Total invitee responses: ${campaign.inviteeResponses.length}`);

    // Prepare template data
    const templateData = {
      campaign: campaign,
      user: req.user,
      message: req.flash('message')[0] || null,
      alertType: req.flash('alertType')[0] || null,
      isMockData: USE_MOCK_DATA
    };

    logger.info(`[SMS Campaign Details] Rendering campaign details template`);
    return res.render(render_ejs_urls.PhishMagnus.Campaign.SMS.VIEW_CAMPAIGN, templateData);

  } catch (error) {
    logger.error(`[SMS Campaign Details] Error: ${error.message}`);
    logger.debug(`[SMS Campaign Details] Stack: ${error.stack}`);


  }
};
