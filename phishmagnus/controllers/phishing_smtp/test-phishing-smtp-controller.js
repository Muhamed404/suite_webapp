const backend_api_urls = require("../../../config/backend_api_urls");
const { logger } = require("../../../logger/logger");
const getApiClient = require('../../../utility/api-client');


exports.testPhishingSMTP = (req, res) => {
  const smtpId = req.params.smtpId;
  logger.info(`Test Phishing SMTP Controller: Incoming request to test smtp id ${smtpId}`);

  const apiClient = getApiClient(req);
  const url = backend_api_urls.PHISHMAGNUS.PHISHING_SMTP.TEST(smtpId);
  logger.info(`Test Phishing SMTP Controller: Calling backend URL ${url}`);

  apiClient
    .get(url)
    .then((response) => {
      const data = response.data;
      logger.info(`Test Phishing SMTP Controller: Response ${JSON.stringify(data, null, 2)}`);
      return res.json({ success: true, message: data.message || 'SMTP connection successful.' });
    })
    .catch((error) => {
      const errData = error.response?.data;
      logger.error(`Test Phishing SMTP Controller: Error testing smtp id ${smtpId}: ${error.message}`);
      logger.error(`Test Phishing SMTP Controller: Backend error response: ${JSON.stringify(errData, null, 2)}`);
      return res.json({ success: false, message: errData?.message || 'SMTP connection failed.' });
    });
};
