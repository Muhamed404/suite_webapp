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
  const totalUniqueClickCount = backendStats?.uniqueInteractionStatistics.is_link_clicked || 0;
  const totalUniqePageClickCount = backendStats?.uniqueInteractionStatistics.is_page_visited || 0;
  const totalUniqueFormInteractionCount = backendStats?.uniqueInteractionStatistics.is_form_interacted || 0;
  const totalUniqueSubmitCount = backendStats?.uniqueInteractionStatistics.is_form_submitted || 0;
  const totalUniqueDownloadCount = backendStats.uniqueInteractionStatistics.is_file_downloaded || 0;
  const totalWhatsappOpenedUniqueCount = backendStats.uniqueInteractionStatistics.is_whatsapp_opened || 0;
  const totalInteractionCount = totalUniqueClickCount + totalUniqePageClickCount + totalUniqueFormInteractionCount + totalUniqueSubmitCount + totalUniqueDownloadCount + totalWhatsappOpenedUniqueCount;


  const totalInviteeReportCount = backendStats.inviteeAndReportCount?.totalReportCount || 0;
  const totalInviteeCount = backendStats.inviteeAndReportCount?.totalInvitee || 0;


  // console.log('Total Interaction Count:', totalInteractionCount);
  const totalSMSSent = backendStats?.totalInviteesCountStats.totalSent || 0;
  const totalDelivered = backendStats?.interactionStatsByCampaign?.is_whatsapp_delivered || 0;
  const totalInvitees = totalSMSSent + backendStats?.totalInviteesCountStats.totalUnSent || 0;
  if (totalSMSSent !== 0) {
    const rate = ((totalSMSSent / totalInvitees) * 100).toFixed(2);
    deliveryRate = `${rate}%`;
  }

  return {
    totalSMSSent: totalSMSSent,
    totalDelivered: totalDelivered,
    totalUniqueClickCount: totalUniqueClickCount,
    totalUniqePageClickCount: totalUniqePageClickCount,
    totalUniqueFormInteractionCount: totalUniqueFormInteractionCount,
    totalUniqueSubmitCount: totalUniqueSubmitCount,
    totalUniqueDownloadCount: totalUniqueDownloadCount,
    totalInteractionCount: totalInteractionCount,
    totalInviteeReportCount: totalInviteeReportCount,
    totalInviteeCount: totalInviteeCount,
    deliveryRate: deliveryRate,
    is_link_clicked: backendStats?.interactionStatsByCampaign?.is_link_clicked || 0,
    is_page_visited: backendStats?.interactionStatsByCampaign?.is_page_visited || 0,
    is_form_interacted: backendStats?.interactionStatsByCampaign?.is_form_interacted || 0,
    is_form_submitted: backendStats?.interactionStatsByCampaign?.is_form_submitted || 0,
    is_file_downloaded: backendStats?.interactionStatsByCampaign?.is_file_downloaded || 0,
    is_whatsapp_replied: backendStats?.interactionStatsByCampaign?.is_whatsapp_replied || 0,
    is_call_made: backendStats?.interactionStatsByCampaign?.is_call_made || 0,
    is_otp_shared: backendStats?.interactionStatsByCampaign?.is_otp_shared || 0,
    is_whatsapp_interacted: backendStats?.interactionStatsByCampaign?.is_whatsapp_interacted || 0
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
    is_whatsapp_delivered: invitee.is_whatsapp_delivered === 1 || invitee.is_whatsapp_delivered === true,
    is_link_clicked: invitee.is_link_clicked === 1 || invitee.is_link_clicked === true,
    is_page_visited: invitee.is_page_visited === 1 || invitee.is_page_visited === true,
    is_form_interacted: invitee.is_form_interacted === 1 || invitee.is_form_interacted === true,
    is_form_submitted: invitee.is_form_submitted === 1 || invitee.is_form_submitted === true,
    is_file_downloaded: invitee.is_file_downloaded === 1 || invitee.is_file_downloaded === true,
    is_whatsapp_replied: invitee.is_whatsapp_replied === 1 || invitee.is_whatsapp_replied === true,
    is_call_made: invitee.is_call_made === 1 || invitee.is_call_made === true,
    is_otp_shared: invitee.is_otp_shared === 1 || invitee.is_otp_shared === true,
    is_whatsapp_interacted: invitee.is_whatsapp_interacted === 1 || invitee.is_whatsapp_interacted === true
  }));
}

/**
 * Format campaign details for template
 * @param {Object} backendCampaign - Campaign data from backend
 * @returns {Object} Formatted campaign object
 */
function formatCampaignDetails(backendCampaign) {
  logger.info(`[Format Campaign Details] Formatting campaign: ${JSON.stringify(backendCampaign, null, 2) || 'N/A'}`);
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
    whatsappStats: transformCampaignStats(backendCampaign),
    inviteeResponses: Array.isArray(backendCampaign.inviteeResponses)
      ? transformInviteeResponses(backendCampaign.inviteeResponses)
      : []
  };
}

/**
 * Get SMS campaign details
 * GET /phm/campaign/whatsapp/:id
 * 
 *  
 */
exports.generateWhatsappCampaignDetails = async (req, res) => {
  try {
    const campaignId = parseInt(req.params.campaignId);

    // Validate campaign ID
    if (isNaN(campaignId) || campaignId <= 0) {
      logger.warn(`[Whatsapp Campaign Details] Invalid campaign ID: ${req.params.campaignId}`);
      req.flash('message', __("whatsapp.campaign_details.invalid_id") || 'Invalid campaign ID');
      req.flash('alertType', 'error');
      return res.redirect(frontend_api_urls.PHISHMAGNUS.Campaign.Whatsapp.LIST);
    }

    logger.info(`[Whatsapp Campaign Details] Fetching details for campaign ID: ${campaignId}`);


    // Fetch from actual backend API
    const apiClient = getApiClient(req);

    const campaignResponse = await apiClient.get(
      backend_api_urls.PHISHMAGNUS.CAMPAIGN.Whatsapp.VIEW(campaignId),
      {
        headers: { 'Accept': 'application/json' }
      }
    );

    logger.info(`[Whatsapp Campaign Details] API Response Status: ${campaignResponse.status}`);
    let backendCampaign = campaignResponse?.data?.data || {};
    logger.info(`[Whatsapp Campaign Details] Backend Campaign Data: ${JSON.stringify(backendCampaign, null, 2) || 'N/A'}`);
    const inviteesCountStats = backendCampaign?.totalInviteesCountStats || {};
    // Format campaign data for template
    const campaign = formatCampaignDetails(backendCampaign);

    logger.info(`[Whatsapp Campaign Details] Campaign found: ${campaign.name}`);
    logger.info(`[Whatsapp Campaign Details] Total invitee responses: ${campaign.inviteeResponses.length}`);

    // Prepare template data
    const templateData = {
      campaign: campaign,
      inviteesCountStats,
      user: req.user
    };

    logger.info(`[Whatsapp Campaign Details] Rendering campaign details template`);
    return res.render(render_ejs_urls.PhishMagnus.Campaign.Whatsapp.VIEW_CAMPAIGN, templateData);

  } catch (error) {
    logger.error(`[Whatsapp Campaign Details] Error: ${error.message}`);
    logger.debug(`[Whatsapp Campaign Details] Stack: ${error.stack}`);


  }
};

