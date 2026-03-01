
const backend_api_urls = require("../../../config/backend_api_urls");
const render_ejs_urls = require("../../../config/render_ejs_urls");
const { logger } = require("../../../logger/logger");
const getApiClient = require('../../../utility/api-client');



exports.listOfPhishingSMTPNameController = (req, res) => {
  logger.info("Listing Of Phishing SMTP Name Controller: Incoming request to list all the phishing SMTPs");
  // return res.render(render_ejs_urls.PhishMagnus.SMTP_PHISHING.LIST);


  const apiClient = getApiClient(req);
  const organizationId = req.user.organization_id ?? 0;

  const url = backend_api_urls.PHISHMAGNUS.PHISHING_SMTP.LIST(organizationId);
  logger.info(`Listing Of Phishing SMTP Name Controller: Backend URL:- ${url}`);
  apiClient
    .get(url)
    .then((response) => {
      const data = response.data;
      logger.info(`Listing Of Phishing SMTP Name Controller: Response ${JSON.stringify(data, null, 2)}`);
      const smtpList = (data?.smtps ?? [])
        .filter(smtp => smtp.is_active == 1)
        .map(smtp => ({ id: smtp.id, sender_email: smtp.sender_email, organization_name: smtp.organization_name}));
      logger.info(`Listing Of Phishing SMTP Name Controller: Total active SMTPs fetched ${smtpList.length}`);

      return res.status(200).json({ smtpList });
    })
    .catch((error) => {
      logger.error(`Listing Of Phishing SMTP Name Controller: Error while fetching the list of phishing SMTPs ${error}`);
      logger.error(`Listing Of Phishing SMTP Name Controller: Error details ${JSON.stringify(error.response?.data, null, 2)}`);
      let data = error.response.data;
      return res.status(200).json({ smtpList: [], error: data?.message || "Failed to fetch SMTP list" });
      
    });
};

