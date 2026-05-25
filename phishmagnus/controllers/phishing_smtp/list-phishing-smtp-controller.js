
const backend_api_urls = require("../../../config/backend_api_urls");
const render_ejs_urls = require("../../../config/render_ejs_urls");
const { logger } = require("../../../logger/logger");
const getApiClient = require('../../../utility/api-client');
const enums = require('../../../contants/enum');
const { redactLogData } = require("../../utility/redact");


exports.listOfPhishingSMTPController = (req, res) => {
  logger.info("Listing Of Phishing SMTP Controller: Incoming request to list all the phishing SMTPs");
  // return res.render(render_ejs_urls.PhishMagnus.SMTP_PHISHING.LIST);


  const apiClient = getApiClient(req);
  const organizationId = req.user.organization_id ?? 0;

  const url = backend_api_urls.PHISHMAGNUS.PHISHING_SMTP.LIST(organizationId);
  logger.info(`Listing Of Phishing SMTP Controller: Backend URL:- ${url}`);
  apiClient
    .get(url)
    .then((response) => {
      const data = response.data;
      logger.info(`Listing Of Phishing SMTP Controller: Response ${JSON.stringify(redactLogData(data), null, 2)}`);
      const smtpList = data?.smtps ?? [];
      logger.info(`Listing Of Phishing SMTP Controller: Total SMTPs fetched ${smtpList.length}`);
      logger.debug(`Listing Of Phishing SMTP Controller: Rendering the list of phishing SMTPs \n ${JSON.stringify(redactLogData(smtpList), null, 2)}`);

      const userPermissions = req.permissions || [];
      const canManageDefault = userPermissions.some(
        perm => perm?.module?.toLowerCase() === enums.ModuleNames.SMTP.toLowerCase()
             && perm?.name?.toLowerCase() === enums.Access_Types.RWD_ALL.toLowerCase()
      );
      const currentUserOrgId = req.user?.organization_id ?? 0;
      logger.info(`Listing Of Phishing SMTP Controller: canManageDefault = ${canManageDefault}, currentUserOrgId = ${currentUserOrgId}`);

      res.render(render_ejs_urls.PhishMagnus.SMTP_PHISHING.LIST, { smtpList, canManageDefault, currentUserOrgId });
    })
    .catch((error) => {
      logger.error(`Listing Of Phishing SMTP Controller: Error while fetching the list of phishing SMTPs ${error}`);
      logger.info(error.response.data);
      let data = error.response.data;
      res.redirect(`/phm/?message=${data.message}&alertType=${data.alertType}`);
    });
};

