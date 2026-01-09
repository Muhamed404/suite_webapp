const config = require("../../../../config/env.config");

const { logger } = require("../../../../logger/logger");
const ICONSTANTS = require("../../../../contants/ICONSTANTS");

const getApiClient = require('../../../../utility/api-client')
const enums = require("../../../../contants/enum");
const render_ejs_urls = require("../../../../config/render_ejs_urls");
const backend_api_urls = require("../../../../config/backend_api_urls");
const frontend_api_urls = require("../../../../config/frontend_api_urls");
const axios = require("axios");

exports.usbCampaignViewReport = async (req, res) => {
  try {
    logger.info(`Controller - USB Campaign View Report - Start`);
    const campaignIdentifier = req.params.campaignIdentifier;
    if (!campaignIdentifier) {
      throw new Error("Campaign ID is required");
    }
    const apiUrl = backend_api_urls.PHISHMAGNUS.CAMPAIGN.USB.CAMPAIGN_REPORT_DETAILS(campaignIdentifier);
    const apiClient = getApiClient(req);
    const response = await apiClient.get(apiUrl);
    const result = response.data;

    const campaigns = result.data;
    logger.info(`Controller - USB Campaign View Report - Data fetched successfully`);
    logger.info(`Controller - USB Campaign View Report - ${JSON.stringify(campaigns, null, 2)}`);

    const pageSize = 5;
    const currentPage = 1;
    const totalDevices = campaigns.usb_devices.length;
    const totalPages = Math.ceil(totalDevices / pageSize);
    const startIdx = (currentPage - 1) * pageSize;
    const endIdx = Math.min(startIdx + pageSize, totalDevices);
    const paginatedDevices = campaigns.usb_devices.slice(startIdx, endIdx);

    res.render(render_ejs_urls.PhishMagnus.Campaign.USB.CAMPAIGN_VIEW_REPORT, {
      campaigns,
      pageSize,
      currentPage,
      totalPages,
      paginatedDevices,
      totalDevices,
      startIdx,
      endIdx

    });
  } catch (err) {
    logger.error(`Controller - USB Campaign View Report - Error: ${err.message}`);
    req.flash("alertType", "error");
    req.flash("message", err.message);
    res.redirect(frontend_api_urls.PHISHMAGNUS.Campaign.USB.REPORT);
  }
};


