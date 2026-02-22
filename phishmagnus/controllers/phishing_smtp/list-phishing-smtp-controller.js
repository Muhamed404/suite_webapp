
const backend_api_urls = require("../../../config/backend_api_urls");
const render_ejs_urls = require("../../../config/render_ejs_urls");
const { logger } = require("../../../logger/logger");
const getApiClient = require('../../../utility/api-client')


exports.listOfPhishingSMTPController = (req, res) => {
  logger.info("Listing Of Phishing SMTP Controller: Incoming request to list all the phishing SMTPs");
  return res.render(render_ejs_urls.PhishMagnus.SMTP_PHISHING.LIST);


  const apiClient = getApiClient(req);
  const organizationId = req.params?.organizationId || 0;
  const url = backend_api_urls.PHISHMAGNUS.PHISHING_SMTP.LIST(organizationId);
  logger.info(`Listing Of Phishing SMTP Controller: Backend URL:- ${url}`);
  apiClient
    .get(url)
    .then((response) => {
      const data = response.data;
      logger.info(`Listing Of Phishing SMTP Controller: Response ${JSON.stringify(data, null, 2)}`);

      res.render(render_ejs_urls.PhishMagnus.SMTP_PHISHING.LIST, { SMTP: data.message });
    })
    .catch((error) => {
      logger.error(`Listing Of Phishing SMTP Controller: Error while fetching the list of phishing SMTPs ${error}`);
      logger.info(error.response.data);
      let data = error.response.data;
      res.redirect(`/phm/?message=${data.message}&alertType=${data.alertType}`);
    });
};

