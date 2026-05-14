const config = require("../../../../config/env.config");
const { logger } = require("../../../../logger/logger");
const enums = require("../../../../contants/enum");
const getApiClient = require('../../../../utility/api-client');
const backend_api_urls = require("../../../../config/backend_api_urls");
const frontend_api_urls = require("../../../../config/frontend_api_urls");
const render_ejs_urls = require("../../../../config/render_ejs_urls");
const { redactLogData } = require("../../../utility/redact");

exports.renderCampaignReport = async (req, res) => {
    try {
        logger.info(`[NFC Campaign Report]: Incoming request for campaign report table`);

        // Session validation
        if (!req.session || !req.user) {
            logger.warn(`[NFC Campaign Report]: No active session - redirecting to login`);
            req.flash('message', 'Please log in to continue.');
            req.flash('alertType', 'error');
            return res.redirect(frontend_api_urls.LOGIN.PHISHMAGNUS);
        }

        if (req.method === "GET") {
            const page = parseInt(req.query.page) || 1;
            const pageSize = parseInt(req.query.pageSize) || 10;

            const campaignFilters = {
                organization_id: req.user.organization_id,
                phishing_campaign_type_id: enums.phishingType.NFC
            };

            const queryParams = new URLSearchParams({
                page: page.toString(),
                pageSize: pageSize.toString(),
                campaignFilters: JSON.stringify(campaignFilters)
            });

            logger.info(`[NFC Campaign Report]: Fetching campaigns with filters: ${JSON.stringify(redactLogData(campaignFilters))}`);

            const apiClient = getApiClient(req);
            const response = await apiClient.get(backend_api_urls.PHISHMAGNUS.CAMPAIGN.NFC.RENDER_REPORT(queryParams), {
                headers: { 'Accept': 'application/json' }
            });

            // Extract data from your backend response format
            const backendData = response?.data || {};
            logger.info(`[NFC Campaign Report]: Backend response: ${JSON.stringify(redactLogData(backendData), null, 2)}`);

            // Updated extraction based on your response structure
            const campaignsData = backendData.data || {};
            const rawCampaigns = campaignsData.campaigns || [];

            // Transform the nested campaign data structure
            const campaigns = rawCampaigns.map(item => {
                const campaign = item.campaign || {};
                return {
                    id: campaign.id,
                    campaign_identifier: campaign.campaign_identifier,
                    name: campaign.name,
                    description: campaign.description,
                    // difficulty: campaign.difficulty,
                    creation_date: campaign.creation_date,
                    start_datetime: campaign.start_datetime,
                    end_datetime: campaign.end_datetime,
                    template_name: item.template?.name || 'N/A',
                    template_id: campaign.template_id,
                    // total_users: item.totalInvitees,
                    totalNFCDeviceCount: item.totalNFCDeviceCount,
                    is_camp_uploaded: campaign.is_camp_uploaded,
                    // Determine status based on dates and upload status
                    status: determineStatus(campaign),
                    is_completed: isCompleted(campaign)
                };
            });

            logger.info(`[NFC Campaign Report]: Retrieved ${campaigns.length} campaigns from backend`);
            logger.info(`[NFC Campaign Report]: Transformed campaigns: ${JSON.stringify(redactLogData(campaigns), null, 2)}`);

            // Use pagination info from backend response
            const totalCount = campaignsData.totalCampaigns || campaigns.length;
            const totalPages = campaignsData.totalPages || Math.ceil(totalCount / pageSize);
            const currentPage = campaignsData.page || page;

            logger.info(`[NFC Campaign Report]: Successfully fetched ${campaigns.length} campaigns (total: ${totalCount})`);
            logger.info(`[NFC Campaign Report]: Backend message: ${backendData.message}`);

            // Prepare data for the template
            const templateData = {
                campaigns: campaigns,
                pagination: {
                    currentPage: currentPage,
                    pageSize: pageSize,
                    totalCount: totalCount,
                    totalPages: totalPages,
                    hasNextPage: currentPage < totalPages,
                    hasPreviousPage: currentPage > 1,
                    nextPage: currentPage + 1,
                    previousPage: currentPage - 1
                },
                filters: {
                    organizationId: req.user.organization_id
                },
                translations: {
                    noCampaignsFound: req.__("all_campaigns.noCampaignsFound"),
                    createFirstCampaign: req.__("all_campaigns.createFirstCampaign")
                },
                user: req.user,
                title: 'NFC Campaign Reports',
                message: res.locals.message || [],
                alertType: res.locals.alertType || []
            };

            // Render the EJS template with campaign data
            return res.render(render_ejs_urls.PhishMagnus.Campaign.NFC.REPORT, templateData);
        }

        // Method not allowed
        return res.status(405).send('Method not allowed');

    } catch (error) {
        logger.error(`[NFC Campaign Report]: Error: ${error.message}`);
        logger.debug(`[NFC Campaign Report]: Stack: ${error.stack}`);

        // Handle different error types
        if (error.response) {
            const statusCode = error.response.status;
            const errorMessage = error.response.data?.message || 'Backend API error';
            logger.error(`[NFC Campaign Report]: Backend API error: ${statusCode} - ${errorMessage}`);
        }
        req.flash('message', 'Error in retrieving campaign reports.');
        req.flash('alertType', 'error');
        return res.redirect(frontend_api_urls.PHISHMAGNUS.Home.INDEX);
    }
};

// Helper function to determine campaign status
function determineStatus(campaign) {
    const now = new Date();
    const startDate = new Date(campaign.start_datetime);
    const endDate = new Date(campaign.end_datetime);

    if (!campaign.is_camp_uploaded) {
        return 'draft';
    } else if (now < startDate) {
        return 'scheduled';
    } else if (now >= startDate && now <= endDate) {
        return 'active';
    } else {
        return 'completed';
    }
}

// Helper function to check if campaign is completed
function isCompleted(campaign) {
    const now = new Date();
    const endDate = new Date(campaign.end_datetime);
    return now > endDate && campaign.is_camp_uploaded;
}
