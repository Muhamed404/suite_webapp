const config = require("../../../../config/env.config");
const { logger } = require("../../../../logger/logger");
const enums = require("../../../../contants/enum");
const getApiClient = require('../../../../utility/api-client');
const backend_api_urls = require("../../../../config/backend_api_urls");
const frontend_api_urls = require("../../../../config/frontend_api_urls");
const render_ejs_urls = require("../../../../config/render_ejs_urls");

exports.renderCampaignReport = async (req, res) => {
    const logContext = `[Email Report Campaign]:`;
    
    try {
        logger.info(`${logContext} Incoming request for campaign report table`);
        
        // Session validation
        if (!req.session || !req.user) {
            logger.warn(`${logContext} No active session - redirecting to login`);
            req.flash('message', 'Please log in to continue.');
            req.flash('alertType', 'error');
            return res.redirect(frontend_api_urls.LOGIN.PHISHMAGNUS);
        }

        if (req.method === "GET") {
            const page = parseInt(req.query.page) || 1;
            const pageSize = parseInt(req.query.pageSize) || 10;
           
            const campaignFilters = {
                organization_id: req.user.organization_id,
                phishing_campaign_type_id: enums.phishingType.Email
            };

            const queryParams = new URLSearchParams({
                page: page.toString(),
                pageSize: pageSize.toString(),
                campaignFilters: JSON.stringify(campaignFilters)
            });

            logger.info(`${logContext} Fetching campaigns with filters: ${JSON.stringify(campaignFilters)}`);

            const apiClient = getApiClient(req);
            const response = await apiClient.get(`/phm/campaign/email/report?${queryParams.toString()}`, {
                headers: { 'Accept': 'application/json' }
            });

            // Extract data from your backend response format
            const backendData = response?.data || {};
            logger.info(`${logContext} Backend response: ${JSON.stringify(backendData, null, 2)}`);
            
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
                    difficulty: campaign.difficulty,
                    creation_date: campaign.creation_date,
                    start_datetime: campaign.start_datetime,
                    end_datetime: campaign.end_datetime,
                    template_name: item.template?.name || 'N/A',
                    template_id: campaign.template_id,
                    total_users: item.totalInvitees,
                    totalInvitees: item.totalInvitees,
                    is_camp_uploaded: campaign.is_camp_uploaded,
                    // Determine status based on dates and upload status
                    status: determineStatus(campaign),
                    is_completed: isCompleted(campaign)
                };
            });
            
            logger.info(`${logContext} Retrieved ${campaigns.length} campaigns from backend`);
            logger.info(`${logContext} Transformed campaigns: ${JSON.stringify(campaigns, null, 2)}`);
            
            // Use pagination info from backend response
            const totalCount = campaignsData.totalCampaigns || campaigns.length;
            const totalPages = campaignsData.totalPages || Math.ceil(totalCount / pageSize);
            const currentPage = campaignsData.page || page;

            logger.info(`${logContext} Successfully fetched ${campaigns.length} campaigns (total: ${totalCount})`);
            logger.info(`${logContext} Backend message: ${backendData.message}`);

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
                    filterAll: req.__("all_campaigns.filterAll"),
                    active: req.__("generic_label.active"),
                    InProgress: req.__("InProgress") === "InProgress" ? (req.getLocale() === 'ar' ? 'قيد التنفيذ' : 'In Progress') : req.__("InProgress"),
                    filterCompleted: req.__("all_campaigns.filterCompleted"),
                    filterScheduled: req.__("all_campaigns.filterScheduled"),
                    filterDraft: req.__("all_campaigns.filterDraft"),
                    showingResults: req.__("all_campaigns.showingResults"),
                    search_here: req.__("generic_label.search_here"),
                    total_invitees: req.getLocale() === 'ar' ? 'إجمالي المدعوين' : 'Total Invitee',
                    unsent: req.getLocale() === 'ar' ? 'في الانتظار' : 'Pending',
                    sent: req.getLocale() === 'ar' ? 'مرسل' : 'Sent'
                },
                user: req.user,
                title: 'Email Campaign Reports',
                message: res.locals.message || [],
                alertType: res.locals.alertType || [],
                locale: req.getLocale()
            };

            // Render the EJS template with campaign data
            return res.render(render_ejs_urls.PhishMagnus.Campaign.Email.CAMPAIGN_REPORT, templateData);
        }

        // Method not allowed
        return res.status(405).send('Method not allowed');

    } catch (error) {
        logger.error(`${logContext} Error: ${error.message}`);
        logger.debug(`${logContext} Stack: ${error.stack}`);

        // Handle different error types
        if (error.response) {
            const statusCode = error.response.status;
            const errorMessage = error.response.data?.message || 'Backend API error';
            logger.error(`${logContext} Backend API error: ${statusCode} - ${errorMessage}`);
            
            if (statusCode === 401) {
                return res.redirect('/phm/login');
            }
        }

        // Redirect with error message
        const errorMsg = encodeURIComponent('Error loading campaign reports');
        return res.redirect(`/phm/?message=${errorMsg}&alertType=error`);
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

// Optional: Separate endpoint for AJAX data
exports.getCampaignReportsData = async (req, res) => {
    const logContext = `[Campaign Reports API]`;
    
    try {
        if (!req.session || !req.user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        
        const campaignFilters = {
            organization_id: req.user.organization_id
        };

        const queryParams = new URLSearchParams({
            page: page.toString(),
            pageSize: pageSize.toString(),
            campaignFilters: JSON.stringify(campaignFilters)
        });

        const apiClient = getApiClient(req);
        const response = await apiClient.get(`/phm/campaign/email/report?${queryParams.toString()}`, {
            headers: { 'Accept': 'application/json' }
        });

        // Extract data from your backend response format
        const backendData = response?.data || {};
        const campaignsData = backendData.data || {};
        const rawCampaigns = campaignsData.campaigns || [];
        
        // Transform the campaigns
        const campaigns = rawCampaigns.map(item => {
            const campaign = item.campaign || {};
            return {
                id: campaign.id,
                name: campaign.name,
                description: campaign.description,
                creation_date: campaign.creation_date,
                start_datetime: campaign.start_datetime,
                end_datetime: campaign.end_datetime,
                template_name: campaign.Templates?.name || 'N/A',
                totalInvitees: item.totalInvitees,
                status: determineStatus(campaign)
            };
        });

        return res.json({
            success: true,
            data: campaigns,
            message: backendData.message || "Campaign reports fetched",
            pagination: {
                page: campaignsData.page || page,
                pageSize: pageSize,
                totalCount: campaignsData.totalCampaigns || campaigns.length,
                totalPages: campaignsData.totalPages || Math.ceil(campaigns.length / pageSize)
            }
        });

    } catch (error) {
        logger.error(`${logContext} Error: ${error.message}`);
        return res.status(500).json({ 
            success: false, 
            message: "Error fetching campaign reports" 
        });
    }
};