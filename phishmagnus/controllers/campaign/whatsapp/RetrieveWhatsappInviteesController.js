const config = require("../../../../config/env.config");
const { logger } = require("../../../../logger/logger");
const getApiClient = require('../../../../utility/api-client');
const backend_api_urls = require("../../../../config/backend_api_urls");


/**
 * Get invitee responses with pagination
 * GET /phm/campaign/sms/:campaignId/invitees?page=1&pageSize=5
 * 
 * Backend Endpoint: GET /phm/campaign/sms/invitees/{campaignId}?page=1&pageSize=5
 * TESTING MODE: Set USE_MOCK_DATA=true to use mock data
 */
exports.generateWhatsappCampaignInviteesReport = async (req, res) => {
  try {
    logger.info(`Retrieving Whatsapp campaign invitees`);
    const campaignId = parseInt(req.params.campaignId);
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const searchTerm = req.query.search || '';

    if (isNaN(campaignId) || campaignId <= 0) {
      logger.warn(`Controller - Whatsapp Invitee Report: Invalid campaign ID: ${req.params.campaignId}`);
      return res.status(400).json({
        success: false,
        message: 'Invalid campaign ID'
      });
    }

    logger.info(`Controller - Whatsapp Invitee Report: Fetching invitees - Campaign: ${campaignId}, Page: ${page}, PageSize: ${pageSize}, Search: ${searchTerm}`);

    let invitees = [];
    let total = 0;
 
      logger.info(`Controller - Whatsapp Invitee Report: Fetching from backend API`);
      
      const apiClient = getApiClient(req);
      
      // Build backend endpoint URL with query parameters
      const backendUrl = backend_api_urls.PHISHMAGNUS.CAMPAIGN.Whatsapp.INVITEES(campaignId);
      
      logger.info(`Controller - Whatsapp Invitee Report: Backend URL: ${backendUrl}`);
      
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

        logger.info(`Controller - Whatsapp Invitee Report: Backend response status: ${response.status}`);

        invitees = response?.data?.data || [];
        total = response?.data?.total || response?.data?.pagination?.total || invitees.length;
        
        logger.info(`Controller - Whatsapp Invitee Report: Backend returned ${invitees.length} invitees (Total: ${total})`);
        logger.info(`Controller - Whatsapp Invitee Report: Invitees Data Sample: ${JSON.stringify(invitees.slice(0,2),null,2)}`);
      } catch (apiError) {
        logger.error(`Controller - Whatsapp Invitee Report: Backend API Error: ${apiError.message}`);
        
        // Fallback to mock data on backend error
        logger.info(`Controller - Whatsapp Invitee Report: Falling back to MOCK data due to API error`);
        
        const startIdx = (page - 1) * pageSize;
        const endIdx = startIdx + pageSize;
        
        invitees = [];
        total = 0;
      }

    logger.info(`Controller - Whatsapp Invitee Report: Pagination: Page ${page} of ${Math.ceil(total / pageSize)}`);

    return res.json({
      success: true,
      data: invitees,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    });

  } catch (error) {
    logger.error(`Controller - Whatsapp Invitee Report: Error: ${error.message}`);
    logger.debug(`Controller - Whatsapp Invitee Report: Stack: ${error.stack}`);
    
    return res.status(500).json({
      success: false,
      message: 'Error retrieving invitees'
    });
  }
};