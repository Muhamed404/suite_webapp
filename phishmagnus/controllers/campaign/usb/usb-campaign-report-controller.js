const config = require("../../../../config/env.config");

const { logger } = require("../../../../logger/logger");
const ICONSTANTS = require("../../../../contants/ICONSTANTS");

const getApiClient = require('../../../../utility/api-client')
const enums = require("../../../../contants/enum");
const render_ejs_urls = require("../../../../config/render_ejs_urls");
const backend_api_urls = require("../../../../config/backend_api_urls");
const frontend_api_urls = require("../../../../config/frontend_api_urls");
const axios = require("axios");

exports.usbCampaignReport = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = 10;
    const apiUrl = backend_api_urls.PHISHMAGNUS.CAMPAIGN.USB.RENDER_REPORT(new URLSearchParams({ page, pageSize }));
    const apiClient = getApiClient(req);
    const response = await apiClient.get(apiUrl);
    const result = response.data;

    const campaigns = result.data.data;
    if (!campaigns || campaigns.length === 0) {
      return res.render(render_ejs_urls.PhishMagnus.Campaign.USB.RENDER_USB_REPORT, {
        campaigns: [],
        page: 1,
        totalPages: 1
      });
    }
    logger.info(`USB Report Data: ${JSON.stringify(campaigns.slice(0, 2), null, 2)}`);
    const total = result.data.total;
    const totalPages = Math.ceil(total / pageSize);

    res.render(render_ejs_urls.PhishMagnus.Campaign.USB.RENDER_USB_REPORT, {
      campaigns,
      page,
      totalPages
    });
  } catch (err) {
    res.render(render_ejs_urls.PhishMagnus.Campaign.USB.RENDER_USB_REPORT, {
      campaigns: [],
      page: 1,
      totalPages: 1,
      error: err.message
    });
  }
};


