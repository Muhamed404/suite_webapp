const config = require("../../../../config/env.config");

const { logger } = require("../../../../logger/logger");
const ICONSTANTS = require("../../../../contants/ICONSTANTS");

const getApiClient = require('../../../../utility/api-client')
const enums = require("../../../../contants/enum");
const render_ejs_urls = require("../../../../config/render_ejs_urls");
const backend_api_urls = require("../../../../config/backend_api_urls");
const frontend_api_urls = require("../../../../config/frontend_api_urls");
const axios = require("axios");
const { redactLogData } = require("../../../utility/redact");

exports.usbCampaignReport = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const search = (req.query.search || '').toString().trim();

    const queryParams = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString()
    });

    if (search) {
      queryParams.append('search', search);
    }

    const apiUrl = backend_api_urls.PHISHMAGNUS.CAMPAIGN.USB.RENDER_REPORT(queryParams);
    const apiClient = getApiClient(req);
    const response = await apiClient.get(apiUrl);
    const result = response.data;

    const campaigns = result?.data?.data || [];
    const total = Number(result?.data?.total || 0);
    const currentPage = Number(result?.data?.page || page);
    const currentPageSize = Number(result?.data?.pageSize || pageSize);
    const totalPages = Math.max(1, Math.ceil(total / currentPageSize));

    const payload = {
      campaigns,
      page: currentPage,
      totalPages,
      pagination: {
        currentPage,
        pageSize: currentPageSize,
        totalCount: total,
        totalPages
      },
      search,
      locale: req.getLocale()
    };

    const wantsJson =
      req.xhr ||
      req.headers["x-requested-with"] === "XMLHttpRequest" ||
      (req.headers.accept && req.headers.accept.includes("application/json"));

    if (wantsJson) {
      return res.json(payload);
    }

    if (!campaigns || campaigns.length === 0) {
      return res.render(render_ejs_urls.PhishMagnus.Campaign.USB.RENDER_USB_REPORT, {
        ...payload,
        campaigns: []
      });
    }
    logger.info(`USB Report Data: ${JSON.stringify(redactLogData(campaigns.slice(0, 2)), null, 2)}`);

    res.render(render_ejs_urls.PhishMagnus.Campaign.USB.RENDER_USB_REPORT, payload);
  } catch (err) {
    const wantsJson =
      req.xhr ||
      req.headers["x-requested-with"] === "XMLHttpRequest" ||
      (req.headers.accept && req.headers.accept.includes("application/json"));

    if (wantsJson) {
      return res.status(500).json({
        campaigns: [],
        page: 1,
        totalPages: 1,
        pagination: {
          currentPage: 1,
          pageSize: 10,
          totalCount: 0,
          totalPages: 1
        },
        search: (req.query.search || '').toString().trim(),
        locale: req.getLocale(),
        error: err.message
      });
    }

    res.render(render_ejs_urls.PhishMagnus.Campaign.USB.RENDER_USB_REPORT, {
      campaigns: [],
      page: 1,
      totalPages: 1,
      pagination: {
        currentPage: 1,
        pageSize: 10,
        totalCount: 0,
        totalPages: 1
      },
      search: (req.query.search || '').toString().trim(),
      locale: req.getLocale(),
      error: err.message
    });
  }
};


