const config = require("../../../../config/env.config");
const { logger } = require("../../../../logger/logger");
const getApiClient = require('../../../../utility/api-client');
const backend_api_urls = require("../../../../config/backend_api_urls");
const frontend_api_urls = require("../../../../config/frontend_api_urls");
const render_ejs_urls = require("../../../../config/render_ejs_urls");
const { formatDateTimeDDMmmYYYYHHmmAMPM } = require('../../../../utility/date-time-utility');



/**
 * Transform invitee response data
 * @param {Array} invitees - Invitee responses from backend
 * @returns {Array} Formatted invitee responses
 */
function transformInviteeResponses(invitees) {
  return invitees.map(invitee => ({
    invitee_id: invitee.invitee_id,
    inviteeName: invitee.inviteeName || invitee.invitee?.name || 'Unknown',
    inviteeEmail: invitee.inviteeEmail || invitee.invitee?.email || 'N/A',
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
 * Get invitee responses with pagination
 * GET /phm/campaign/sms/:campaignId/invitees?page=1&pageSize=5
 * 
 * Backend Endpoint: GET /phm/campaign/sms/invitees/{campaignId}?page=1&pageSize=5
 * TESTING MODE: Set USE_MOCK_DATA=true to use mock data
 */
exports.getSMSCampaignInvitees = async (req, res) => {
  try {
    logger.info(`Retrieving SMS campaign invitees`);
    const campaignId = parseInt(req.params.campaignId);
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const searchTerm = req.query.search || '';
    const USE_MOCK_DATA = 'false'; // Toggle: 'true' for mock data, 'false' for real API

    if (isNaN(campaignId) || campaignId <= 0) {
      logger.warn(`[SMS Campaign Invitees] Invalid campaign ID: ${req.params.campaignId}`);
      return res.status(400).json({
        success: false,
        message: 'Invalid campaign ID'
      });
    }

    logger.info(`[SMS Campaign Invitees] Fetching invitees - Campaign: ${campaignId}, Page: ${page}, PageSize: ${pageSize}, Search: ${searchTerm}`);
    logger.info(`[SMS Campaign Invitees] Mock Data Mode: ${USE_MOCK_DATA}`);

    let invitees = [];
    let total = 0;
 
      logger.info(`[SMS Campaign Invitees] Fetching from backend API`);
      
      const apiClient = getApiClient(req);
      
      // Build backend endpoint URL with query parameters
      const backendUrl = backend_api_urls.PHISHMAGNUS.CAMPAIGN.SMS.INVITEES(campaignId);
      
      logger.info(`[SMS Campaign Invitees] Backend URL: ${backendUrl}`);
      
      try {
        // Fetch from backend API with pagination
        const response = await apiClient.get(backendUrl, {
          params: { 
            page, 
            pageSize,
            search: searchTerm 
          },
          headers: { 'Accept': 'application/json' }
        });

        logger.info(`[SMS Campaign Invitees] Backend response status: ${response.status}`);

        invitees = response?.data?.data || [];
        total = response?.data?.total || response?.data?.pagination?.total || invitees.length;
        
        logger.info(`[SMS Campaign Invitees] Backend returned ${invitees.length} invitees (Total: ${total})`);
        logger.info(`[SMS Campaign Invitees] Invitees Data Sample: ${JSON.stringify(invitees.slice(0,2),null,2)}`);
      } catch (apiError) {
        logger.error(`[SMS Campaign Invitees] Backend API Error: ${apiError.message}`);
        
        // Fallback to mock data on backend error
        logger.info(`[SMS Campaign Invitees] Falling back to MOCK data due to API error`);
        
        const startIdx = (page - 1) * pageSize;
        const endIdx = startIdx + pageSize;
        
        invitees = MOCK_INVITEES.slice(startIdx, endIdx);
        total = MOCK_INVITEES.length;
      }

    // Transform invitee responses
    const formattedInvitees = transformInviteeResponses(invitees);

    logger.info(`[SMS Campaign Invitees] Pagination: Page ${page} of ${Math.ceil(total / pageSize)}`);

    return res.json({
      success: true,
      data: formattedInvitees,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    });

  } catch (error) {
    logger.error(`[SMS Campaign Invitees] Error: ${error.message}`);
    logger.debug(`[SMS Campaign Invitees] Stack: ${error.stack}`);
    
    return res.status(500).json({
      success: false,
      message: 'Error retrieving invitees'
    });
  }
};