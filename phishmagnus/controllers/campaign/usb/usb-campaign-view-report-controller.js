const config = require("../../../../config/env.config");

const { logger } = require("../../../../logger/logger");
const ICONSTANTS = require("../../../../contants/ICONSTANTS");

const getApiClient = require('../../../../utility/api-client')
const enums = require("../../../../contants/enum");
const render_ejs_urls = require("../../../../config/render_ejs_urls");
const backend_api_urls = require("../../../../config/backend_api_urls");
const frontend_api_urls = require("../../../../config/frontend_api_urls");
const axios = require("axios");
const moment = require('moment');
const { formatDateTimeDDMmmYYYYHHmmAMPM } = require('../../../../utility/date-time-utility');
const { redactLogData } = require("../../../utility/redact");

function formatUsbDeviceDates(devices) {
  return (devices || []).map((device) => ({
    ...device,
    creation_date: device?.creation_date
      ? formatDateTimeDDMmmYYYYHHmmAMPM(device.creation_date)
      : device?.creation_date
  }));
}

exports.usbCampaignViewReport = async (req, res) => {
  try {
    logger.info(`Controller - USB Campaign View Report - Start`);
    const campaignIdentifier = req.params.campaignIdentifier;
    const searchQuery = (req.query.search || "").toString().trim();
    const allowedPageSizes = [5, 10, 20];
    const requestedPageSize = parseInt(req.query.pageSize, 10) || 5;
    const pageSize = allowedPageSizes.includes(requestedPageSize) ? requestedPageSize : 5;
    const requestedPage = Math.max(parseInt(req.query.page, 10) || 1, 1);
    if (!campaignIdentifier) {
      throw new Error("Campaign ID is required");
    }
    const apiUrl = backend_api_urls.PHISHMAGNUS.CAMPAIGN.USB.CAMPAIGN_REPORT_DETAILS(campaignIdentifier);
    const apiClient = getApiClient(req);
    const response = await apiClient.get(apiUrl);
    const result = response.data;

    const campaigns = result.data;
    logger.info(`Controller - USB Campaign View Report - Data fetched successfully`);
    logger.info(`Controller - USB Campaign View Report - ${JSON.stringify(redactLogData(campaigns), null, 2)}`);

    if (campaigns?.start_datetime) {
      campaigns.start_datetime = formatDateTimeDDMmmYYYYHHmmAMPM(campaigns.start_datetime);
    }

    const allUsbDevices = Array.isArray(campaigns.usb_devices) ? campaigns.usb_devices : [];
    const totalDevices = allUsbDevices.length;
    const normalizedSearch = searchQuery.toLowerCase();
    const filteredUsbDevices = normalizedSearch
      ? allUsbDevices.filter((device) => {
          const usbCode = (device?.usb_code || "").toString().toLowerCase();
          const description = (device?.description || "").toString().toLowerCase();
          const creationDate = device?.creation_date
            ? moment(device.creation_date).format("DD-MMM-YYYY hh:mm A").toLowerCase()
            : "";

          return (
            usbCode.includes(normalizedSearch) ||
            description.includes(normalizedSearch) ||
            creationDate.includes(normalizedSearch)
          );
        })
      : allUsbDevices;

    const filteredDevicesCount = filteredUsbDevices.length;
    const totalPages = Math.max(Math.ceil(filteredDevicesCount / pageSize), 1);
    const currentPage = Math.min(requestedPage, totalPages);
    const startIdx = (currentPage - 1) * pageSize;
    const endIdx = Math.min(startIdx + pageSize, filteredDevicesCount);
    const paginatedDevices = formatUsbDeviceDates(filteredUsbDevices.slice(startIdx, endIdx));

    if (req.query.ajax === "1") {
      return res.json({
        success: true,
        data: {
          paginatedDevices,
          pagination: {
            currentPage,
            totalPages,
            pageSize,
            totalDevices,
            filteredDevicesCount,
            startIdx,
            endIdx
          },
          searchQuery
        }
      });
    }

    res.render(render_ejs_urls.PhishMagnus.Campaign.USB.CAMPAIGN_VIEW_REPORT, {
      campaigns,
      pageSize,
      currentPage,
      totalPages,
      paginatedDevices,
      totalDevices,
      filteredDevicesCount,
      pagination: {
        currentPage,
        totalPages,
        pageSize,
        totalCount: filteredDevicesCount
      },
      searchQuery,
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


