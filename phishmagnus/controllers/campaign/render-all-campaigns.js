const { logger } = require("../../../logger/logger");
const enums = require("../../../contants/enum");
const getApiClient = require("../../../utility/api-client");
const backend_api_urls = require("../../../config/backend_api_urls");
const frontend_api_urls = require("../../../config/frontend_api_urls");
const render_ejs_urls = require("../../../config/render_ejs_urls");

const CAMPAIGN_TYPES = [
  { key: "email", label: "Email", fetcher: fetchEmailCampaigns },
  { key: "qr", label: "QR", fetcher: fetchQRCampaigns },
  { key: "nfc", label: "NFC", fetcher: fetchNFCCampaigns },
  { key: "sms", label: "SMS", fetcher: fetchSMSCampaigns },
  { key: "whatsapp", label: "Whatsapp", fetcher: fetchWhatsappCampaigns },
  { key: "usb", label: "USB", fetcher: fetchUSBCampaigns },
];

exports.renderAllCampaigns = async (req, res) => {
  const logCtx = "[All Campaigns]";

  try {
    if (!req.session || !req.user) {
      logger.warn(`${logCtx} No active session - redirecting to login`);
      req.flash("message", "Please log in to continue.");
      req.flash("alertType", "error");
      return res.redirect(frontend_api_urls.LOGIN.PHISHMAGNUS);
    }

    const campaigns = await collectCampaigns(req);
    const typeOptions = CAMPAIGN_TYPES.map(({ key, label }) => ({ key, label }));

    return res.render(render_ejs_urls.PhishMagnus.Campaign.All.LIST, {
      campaigns: Array.isArray(campaigns) ? campaigns : [],
      typeOptions: Array.isArray(typeOptions) ? typeOptions : [],
      message: res.locals.message || [],
      alertType: res.locals.alertType || [],
      user: req.user,
      magnusAdmin: typeof res.locals.magnusAdmin !== "undefined" ? res.locals.magnusAdmin : (req.user?.organization_id === null)
    });
  } catch (error) {
    logger.error(`${logCtx} Error rendering campaigns page: ${error.message}`);
    logger.error(error.stack);

    req.flash("message", "Unable to load campaigns. Please try again.");
    req.flash("alertType", "error");
    return res.redirect("/phm/?message=campaigns-unavailable&alertType=error");
  }
};

async function collectCampaigns(req) {
  const results = await Promise.all(
    CAMPAIGN_TYPES.map(async (type) => {
      if (typeof type.fetcher !== "function") {
        return [];
      }
      try {
        return await type.fetcher(req, type);
      } catch (error) {
        logger.error(`[All Campaigns] Failed to fetch ${type.key} campaigns: ${error.message}`);
        return [];
      }
    })
  );

  return results
    .flat()
    .sort((a, b) => new Date(b.startDate || 0) - new Date(a.startDate || 0));
}

function buildCampaignQuery(req, phishingTypeId) {
  return new URLSearchParams({
    page: "1",
    pageSize: "50",
    campaignFilters: JSON.stringify({
      organization_id: req.user.organization_id,
      phishing_campaign_type_id: phishingTypeId,
    }),
  });
}

async function fetchEmailCampaigns(req) {
  const queryParams = buildCampaignQuery(req, enums.phishingType.Email);
  const endpoint = (backend_api_urls.PHISHMAGNUS.CAMPAIGN.EMAIL.RENDER_EMAIL_CAMPAIGN_REPORT || "")
    .replace(/\/$/, "");
  const url = `${endpoint}?${queryParams.toString()}`;

  const apiClient = getApiClient(req);
  const response = await apiClient.get(url, { headers: { Accept: "application/json" } });
  const campaignsData = response?.data?.data || {};
  const rawCampaigns = campaignsData.campaigns || [];

  return rawCampaigns.map((item) => {
    const campaign = item.campaign || {};
    return normalizeCampaign(campaign, {
      templateName: item.template?.name || "N/A",
      totalTargets: item.totalInvitees ?? 0,
      typeKey: "email",
      typeLabel: "Email",
      detailPath: campaign.id ? `/phm/campaign/email/details/${campaign.id}` : "#",
    });
  });
}

async function fetchQRCampaigns(req) {
  const queryParams = buildCampaignQuery(req, enums.phishingType.QR);
  const apiClient = getApiClient(req);
  const url = backend_api_urls.PHISHMAGNUS.CAMPAIGN.QR.RENDER_REPORT(queryParams);

  const response = await apiClient.get(url, { headers: { Accept: "application/json" } });
  const campaignsData = response?.data?.data || {};
  const rawCampaigns = campaignsData.campaigns || [];

  return rawCampaigns.map((item) => {
    const campaign = item.campaign || {};
    return normalizeCampaign(campaign, {
      templateName: item.template?.name || "N/A",
      totalTargets: item.totalQRCount ?? 0,
      typeKey: "qr",
      typeLabel: "QR",
      detailPath: campaign.id ? `/phm/campaign/qr/details/${campaign.id}` : "#",
    });
  });
}

async function fetchNFCCampaigns(req) {
  const queryParams = buildCampaignQuery(req, enums.phishingType.NFC);
  const apiClient = getApiClient(req);
  const url = backend_api_urls.PHISHMAGNUS.CAMPAIGN.NFC.RENDER_REPORT(queryParams);

  const response = await apiClient.get(url, { headers: { Accept: "application/json" } });
  const campaignsData = response?.data?.data || {};
  const rawCampaigns = campaignsData.campaigns || [];

  return rawCampaigns.map((item) => {
    const campaign = item.campaign || {};
    return normalizeCampaign(campaign, {
      templateName: item.template?.name || "N/A",
      totalTargets: item.totalNFCDeviceCount ?? 0,
      typeKey: "nfc",
      typeLabel: "NFC",
      detailPath: campaign.id ? `/phm/campaign/nfc/details/${campaign.id}` : "#",
    });
  });
}

async function fetchSMSCampaigns(req) {
  const queryParams = buildCampaignQuery(req, enums.phishingType.SMS);
  const apiClient = getApiClient(req);
  const url = backend_api_urls.PHISHMAGNUS.CAMPAIGN.SMS.RENDER_REPORT(queryParams);

  const response = await apiClient.get(url, { headers: { Accept: "application/json" } });
  const campaignsData = response?.data?.data || {};
  const rawCampaigns = campaignsData.campaigns || [];

  return rawCampaigns.map((item) => {
    const campaign = item; // SMS response has campaign data directly in item
    return normalizeCampaign(campaign, {
      templateName: item.template?.name || "N/A",
      totalTargets: item.smsStats?.totalInvitees ?? 0,
      typeKey: "sms",
      typeLabel: "SMS",
      detailPath: campaign.id ? `/phm/campaign/sms/report/campaign/${campaign.id}` : "#",
    });
  });
}

async function fetchWhatsappCampaigns(req) {
  const queryParams = buildCampaignQuery(req, enums.phishingType.Whatsapp);
  const apiClient = getApiClient(req);
  const url = backend_api_urls.PHISHMAGNUS.CAMPAIGN.Whatsapp.RENDER_REPORT(queryParams);

  const response = await apiClient.get(url, { headers: { Accept: "application/json" } });
  const campaignsData = response?.data?.data || {};
  const rawCampaigns = campaignsData.campaigns || [];

  return rawCampaigns.map((item) => {
    const campaign = item; // WhatsApp response has campaign data directly in item
    return normalizeCampaign(campaign, {
      templateName: item.template?.name || "N/A",
      totalTargets: item.smsStats?.totalInvitees ?? 0,
      typeKey: "whatsapp",
      typeLabel: "Whatsapp",
      detailPath: (campaign.id || campaign.campaign_identifier) ? `/phm/campaign/whatsapp/report/campaign/${campaign.id || campaign.campaign_identifier}` : "#",
    });
  });
}

async function fetchUSBCampaigns(req) {
  const queryParams = buildCampaignQuery(req, enums.phishingType.USB);
  const apiClient = getApiClient(req);
  const url = backend_api_urls.PHISHMAGNUS.CAMPAIGN.USB.RENDER_REPORT(queryParams);

  const response = await apiClient.get(url, { headers: { Accept: "application/json" } });
  const campaignsData = response?.data?.data || {};
  const rawCampaigns = campaignsData.data || [];

  return rawCampaigns.map((item) => {
    const campaign = item; // USB response has campaign data directly in item
    return normalizeCampaign(campaign, {
      templateName: "N/A", // USB doesn't have template in response
      totalTargets: item.total_usb_created ?? 0,
      typeKey: "usb",
      typeLabel: "USB",
      detailPath: campaign.campaign_identifier ? `/phm/campaign/usb/report-view/${campaign.campaign_identifier}` : "#",
    });
  });
}

function normalizeCampaign(campaign = {}, extras = {}) {
  const startDate = campaign.start_datetime || campaign.scheduled_date || campaign.start_date || null;
  const endDate = campaign.end_datetime || startDate || null;

  return {
    id: campaign.id || campaign.campaign_id || null,
    campaignIdentifier: campaign.campaign_identifier || "",
    name: campaign.name || campaign.campaign_name || "Untitled Campaign",
    templateName: extras.templateName || "N/A",
    startDate,
    endDate,
    status: determineStatus(campaign),
    totalTargets: extras.totalTargets ?? null,
    typeKey: extras.typeKey,
    typeLabel: extras.typeLabel || extras.typeKey || "Campaign",
    detailPath: extras.detailPath || "#",
  };
}

function determineStatus(campaign = {}) {
  const now = new Date();
  const startDate = new Date(campaign.start_datetime || campaign.scheduled_date || campaign.start_date || now);
  const endDate = new Date(campaign.end_datetime || campaign.scheduled_date || campaign.start_date || now);

  if (!campaign.is_camp_uploaded && campaign.is_camp_uploaded !== undefined) {
    return "draft";
  }
  if (now < startDate) {
    return "scheduled";
  }
  if (now >= startDate && now <= endDate) {
    return "active";
  }
  return "completed";
}

