const { logger } = require("../../../logger/logger");
const LicenseService = require('../../services/license/licenseService')
const { redactLogData } = require("../../../utility/redact");


exports.renderProductSuite = async (req, res) => {
  logger.info("[PSuite Render]: DISPLAY SUITE MANAGEMENT ::: HAS CALLED.");
  try {
    if (req.method === "GET") {
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
      logger.info("[PSuite Render]: Rending Product Suite Management");

      return res.render("pages/product_suite_management/suite_management", {

        phmConsumeLicense,
        phmLicenseExpiry,
        phmAvailableUserLicense,
        phmPurchasedLicense,

        awmConsumeLicense,
        awmLicenseExpiry,
        awmPurchasedLicense,
        awmAvailableUserLicense,

        // consumedAWMUserLicense,
        // totalAWMPurchasedUserLicense,
        // availableAWMUserLicense,
        enableSuiteManagementLeftMenu: true,
        // phishMagnusLicenseDetails: respPhishMagnusLicenseDetails[0],
        // totalLicensesUsed,
        magnusAdmin: req.user?.organization_id === null ? Boolean(true) : Boolean(false) // hide buttons for magnus admin as they will not do any campaign
      });
    }
  } catch (error) {
    logger.error("[PSuite Render]: " + redactLogData(error.message));
    logger.error("[PSuite Render]: " + redactLogData(error));
    logger.error("[PSuite Render]: " + redactLogData(error.stack));
    res.redirect("/psm/?message=Issue in Product Suite Management=error");
  }
};