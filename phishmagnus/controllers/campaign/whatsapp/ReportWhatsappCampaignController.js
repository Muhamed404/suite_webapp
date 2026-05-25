const config = require("../../../../config/env.config");
const { logger } = require("../../../../logger/logger");
const enums = require("../../../../contants/enum");
const getApiClient = require('../../../../utility/api-client');
const backend_api_urls = require("../../../../config/backend_api_urls");
const frontend_api_urls = require("../../../../config/frontend_api_urls");
const render_ejs_urls = require("../../../../config/render_ejs_urls");
const {getStatusBadgeColor} = require('../../../../utility/helperFunctions');
const { redactLogData } = require("../../../utility/redact");
/**
 * Transform raw campaign data from backend
 * @param {Array} rawCampaigns - Raw campaigns array from backend
 * @returns {Array} Transformed campaigns
 */
function transformCampaignData(rawCampaigns) {
    return rawCampaigns.map(campaign => ({
        id: campaign.id,
        campaign_identifier: campaign.campaign_identifier,
        name: campaign.name,
        templateName: campaign.template?.name || 'N/A',
        templateId: campaign.template?.id,
        totalInvitees: campaign.smsStats?.totalInvitees || 0,
        totalDelivered: campaign.smsStats?.totalDelivered || 0,
        deliveryRate: campaign.smsStats?.deliveryRate || '0.00%',
        // campaignStatus: campaign.campaignStatus || 'Unknown',
        campaignStatus: enums.campaignStatus[campaign.campaignStatus] || 'Unknown',
        isActive: campaign.campaignDuration?.isActive || false,
        statusBadgeColor: getStatusBadgeColor(campaign.campaignStatus),
        activeBadgeColor: campaign.campaignDuration?.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
    }));
}



/**
 * Prepare pagination data for template
 * @param {Object} paginationData - Pagination data from backend
 * @returns {Object} Formatted pagination data
 */
function preparePaginationData(paginationData) {
    return {
        currentPage: paginationData.page || 1,
        pageSize: paginationData.pageSize || 10,
        totalPages: paginationData.totalPages || 1,
        totalCampaigns: paginationData.totalCampaigns || 0,
        hasNextPage: paginationData.hasNextPage || false,
        hasPreviousPage: paginationData.hasPreviousPage || false,
        startItem: ((paginationData.page - 1) * paginationData.pageSize) + 1,
        endItem: Math.min(paginationData.page * paginationData.pageSize, paginationData.totalCampaigns)
    };
}

/**
 * Render SMS campaign report page
 * GET /phm/campaign/sms/report
 */
exports.renderWhatsappCampaignReport = async (req, res) => {
    try {
        logger.info(`[SMS Campaign Report] Incoming request for campaign report`);

        // Validate and sanitize query parameters
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize) || 10));
        const searchQuery = (req.query.searchQuery || '').toString().trim();
        const isActiveFilter = req.query.isActive === 'true' || req.query.isActive === 'false'
            ? req.query.isActive
            : '';

        logger.info(`[SMS Campaign Report] Page: ${page}, PageSize: ${pageSize}`);

        const apiClient = getApiClient(req);

        // Create query parameters
        const queryParams = new URLSearchParams({
            page: page.toString(),
            pageSize: pageSize.toString()
        });

        if (searchQuery) {
            queryParams.append('searchQuery', searchQuery);
        }

        if (isActiveFilter) {
            queryParams.append('isActive', isActiveFilter);
        }

        // FIXED: Call the function with queryParams as argument
        const url = backend_api_urls.PHISHMAGNUS.CAMPAIGN.Whatsapp.RENDER_REPORT(queryParams);

        logger.info(`[SMS Campaign Report] Fetching from URL: ${url}`);

        const response = await apiClient.get(url, {
            headers: { 'Accept': 'application/json' }
        });

        logger.info(`[SMS Campaign Report] API Response Status: ${response.status}`);

        // Extract nested data from response structure
        const backendData = response?.data?.data || {};
        const rawCampaigns = Array.isArray(backendData.campaigns) ? backendData.campaigns : [];
        const paginationData = backendData.pagination || {};


        let statsData = backendData.stats || {};
        if (isActiveFilter) {
            const statsQueryParams = new URLSearchParams({
                page: page.toString(),
                pageSize: pageSize.toString()
            });

            if (searchQuery) {
                statsQueryParams.append('searchQuery', searchQuery);
            }

            const statsUrl = backend_api_urls.PHISHMAGNUS.CAMPAIGN.Whatsapp.RENDER_REPORT(statsQueryParams);
            const statsResponse = await apiClient.get(statsUrl, {
                headers: { 'Accept': 'application/json' }
            });

            const statsBackendData = statsResponse?.data?.data || {};
            statsData = statsBackendData.stats || statsData;
        }

        // Transform campaign data
        const campaigns = transformCampaignData(rawCampaigns);
        const pagination = preparePaginationData(paginationData);
        const stats = {
            active: Number(statsData.active || 0),
            inactive: Number(statsData.inactive || 0)
        };

        logger.info(`[SMS Campaign Report] Retrieved ${campaigns.length} campaigns`);
        logger.info(`[SMS Campaign Report] Total campaigns: ${pagination.totalCampaigns}`);

        // Prepare template data
        const templateData = {
            campaigns: campaigns,
            pagination: pagination,
            stats: stats,
            searchQuery: searchQuery,
            isActiveFilter: isActiveFilter,
            user: req.user,
            message: req.flash('message')[0] || null,
            alertType: req.flash('alertType')[0] || null,
            hasMessages: campaigns.length === 0,
            emptyMessage: req.__('whatsapp.campaign_report.empty_message')
        };

        logger.info(`[SMS Campaign Report] Rendering template with ${campaigns.length} campaigns`);
        return res.render(render_ejs_urls.PhishMagnus.Campaign.Whatsapp.CAMPAIGN_REPORT, templateData);

    } catch (error) {
        logger.error(`[SMS Campaign Report] Error: ${error.message}`);
        logger.debug(`[SMS Campaign Report] Stack: ${error.stack}`);

        let errorMessage = 'Error retrieving SMS campaign reports. Please try again.';

        if (error.response) {
            const statusCode = error.response.status;
            const backendMessage = error.response.data?.message || 'Unknown error';

            logger.error(`[SMS Campaign Report] Backend API error: ${statusCode} - ${backendMessage}`);

            if (statusCode === 404) {
                errorMessage = 'No SMS campaigns found for your organization.';
            } else if (statusCode === 403) {
                errorMessage = 'You do not have permission to view SMS campaign reports.';
            } else if (statusCode === 500) {
                errorMessage = 'Backend server error. Please try again later.';
            }
        }

        req.flash('message', errorMessage);
        req.flash('alertType', 'error');
        return res.redirect(frontend_api_urls.PHISHMAGNUS.Home.INDEX);
    }
};

/**
 * Get campaign details
 * GET /phm/campaign/sms/:id
 */
exports.getCampaignDetails = async (req, res) => {
    try {
        const campaignId = parseInt(req.params.id);

        if (isNaN(campaignId) || campaignId <= 0) {
            logger.warn(`[SMS Campaign Details] Invalid campaign ID: ${req.params.id}`);
            req.flash('message', 'Invalid campaign ID');
            req.flash('alertType', 'error');
            return res.redirect(frontend_api_urls.PHISHMAGNUS.Campaign.SMS.LIST);
        }

        logger.info(`[SMS Campaign Details] Fetching details for campaign ID: ${campaignId}`);

        const apiClient = getApiClient(req);
        const response = await apiClient.get(`${backend_api_urls.PHISHMAGNUS.CAMPAIGN.Whatsapp.VIEW}/${campaignId}`);

        const campaign = response?.data?.data || {};
        logger.info(`[SMS Campaign Details] Backend campaign data: ${JSON.stringify(redactLogData(campaign), null, 2)}`);

        const templateData = {
            campaign: campaign,
            user: req.user,
            message: req.flash('message')[0] || null,
            alertType: req.flash('alertType')[0] || null
        };

        return res.render(render_ejs_urls.PhishMagnus.Campaign.Whatsapp.CAMPAIGN_DETAILS, templateData);

    } catch (error) {
        logger.error(`[SMS Campaign Details] Error: ${error.message}`);
        req.flash('message', 'Error retrieving campaign details');
        req.flash('alertType', 'error');
        return res.redirect(frontend_api_urls.PHISHMAGNUS.Campaign.SMS.LIST);
    }
};


