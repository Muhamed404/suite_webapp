
const { logger } = require("../../logger/logger");
const enums = require("../../contants/enum");
const LicenseService = require("../../productsuite/services/license/licenseService");
const RENDER_PAGE_URLS = require('../../config/render_ejs_urls');
const FRONTEND_API = require('../../config/frontend_api_urls');

const getApiClient = require('../../utility/api-client');


exports.dashboard = async (req, res, next) => {
  try {


    // logger.info(`Inside home controller index \n ${JSON.stringify(req.session)}`);
    logger.info(`[AWM Dashboard]: Incoming request`);
    const user = req?.session?.user || null;

    const licenseInformation = await LicenseService.retrieveSuiteManagementLicenseInformation(req);
    logger.info('[AWM Dashboard]: Dashboard AWM License Details ' + JSON.stringify(licenseInformation, null, 2))

    const AWMLicense = licenseInformation?.AWM;
    const awmConsumeLicense = AWMLicense.Subscription.TotalUserLicense - AWMLicense.Subscription.TotalAvailable;
    const awmPurchasedLicense = AWMLicense.Subscription.TotalUserLicense;
    const awmAvailableUserLicense = AWMLicense.Subscription.TotalAvailable;
    const awmLicenseExpiry = AWMLicense.Subscription?.expiry_date || 'N/A';

    return res.render(RENDER_PAGE_URLS.AwareMagnud.PRODUCT_DASHBOARD, {
      awmConsumeLicense,
      awmPurchasedLicense,
      awmAvailableUserLicense,
      awmLicenseExpiry
    })

  } catch (error) {
    logger.error(`[AWM Dashboard]: Err- ${error?.message || null}`);
    logger.error(`[AWM Dashboard]: Err- ${error.stack}`);

    res.redirect(FRONTEND_API.LOGIN.AWAREMAGNUS, { locale: req.getLocale() });
  };
}
