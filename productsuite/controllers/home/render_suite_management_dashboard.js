const { logger } = require("../../../logger/logger");
const LicenseService = require('../../services/license/licenseService')
const getApiClient = require('../../../utility/api-client');
const Backend_URL = require('../../../config/backend_api_urls')
exports.renderSuiteManagementDashboard = async (req, res) => {

  const licenseInformation = await LicenseService.retrieveSuiteManagementLicenseInformation(req);

  const PhishMagnusLicense = licenseInformation?.PhishMagnus;
  const AWMLicense = licenseInformation?.AwareMagnus;

  const phmConsumeLicense = PhishMagnusLicense.Subscription.TotalUserLicense - PhishMagnusLicense.Subscription.TotalAvailable;
  const phmLicenseExpiry = PhishMagnusLicense.Subscription?.expiry_date || 'N/A';
  const phmPurchasedLicense = PhishMagnusLicense.Subscription.TotalUserLicense;
  const phmAvailableUserLicense = PhishMagnusLicense.Subscription.TotalAvailable;
  const awmConsumeLicense = AWMLicense.Subscription.TotalUserLicense - AWMLicense.Subscription.TotalAvailable;
  const awmPurchasedLicense = AWMLicense.Subscription.TotalUserLicense;
  const awmAvailableUserLicense = AWMLicense.Subscription.TotalAvailable;
  const awmLicenseExpiry = AWMLicense.Subscription?.expiry_date || 'N/A';

  let url = Backend_URL.PHISHMAGNUS.DASHBOARD_STATISTICS;
  const apiClient = getApiClient(req);
  const response = await apiClient.get(url)
  const statistics = response.data?.message; // Assuming response data has the stats you need
  const campaignStatsByPhishingType = statistics.campaignStatsByPhishingType;
  const totalCampaignsCount = statistics.totalCampaignsCount;

  console.log(JSON.stringify(campaignStatsByPhishingType))
  const emailStats = campaignStatsByPhishingType.email ?? null;
  const qrStats = campaignStatsByPhishingType.qr ?? null;
  const usbStats = campaignStatsByPhishingType.usb ?? null;
  const nfcStats = campaignStatsByPhishingType.nfc ?? null;
  const smsStats = campaignStatsByPhishingType.sms ?? null;
  const whatsappStats = campaignStatsByPhishingType.sms ?? null;
  return res.render("pages/product_suite_management/suite_mgmt_dashboard", {
    enableSuiteManagementLeftMenu: true,
    phmConsumeLicense,
    phmLicenseExpiry,
    phmPurchasedLicense,
    phmAvailableUserLicense,
    awmConsumeLicense,
    awmPurchasedLicense,
    awmAvailableUserLicense,
    awmLicenseExpiry,
    totalCampaignsCount,
    emailStats,
    qrStats,
    usbStats,
    nfcStats,
    smsStats,
    whatsappStats
  });
};