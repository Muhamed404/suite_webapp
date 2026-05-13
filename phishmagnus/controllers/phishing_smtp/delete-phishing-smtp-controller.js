const backend_api_urls = require("../../../config/backend_api_urls");
const frontend_api_urls = require("../../../config/frontend_api_urls");
const { logger } = require("../../../logger/logger");
const getApiClient = require('../../../utility/api-client');
const { redactLogData } = require("../../utility/redact");


exports.deletePhishingSMTP = (req, res) => {
  const smtpId = req.params.smtpId;
  logger.info(`Delete Phishing SMTP Controller: Incoming request to delete smtp id ${smtpId}`);

  const apiClient = getApiClient(req);
  const url = backend_api_urls.PHISHMAGNUS.PHISHING_SMTP.DELETE(smtpId);
  logger.info(`Delete Phishing SMTP Controller: Calling backend URL ${url}`);

  apiClient
    .delete(url)
    .then((response) => {
      const data = response.data;
      logger.info(`Delete Phishing SMTP Controller: Response ${JSON.stringify(redactLogData(data), null, 2)}`);
      req.flash('message', data.message || 'SMTP configuration deleted successfully.');
      req.flash('alertType', 'success');
      return res.redirect(frontend_api_urls.PHISHMAGNUS.SMTP_PHISHING.LIST);
    })
    .catch((error) => {
      const errData = error.response?.data;
      logger.error(`Delete Phishing SMTP Controller: Error deleting smtp id ${smtpId}: ${error.message}`);
      logger.error(`Delete Phishing SMTP Controller: Backend error response: ${JSON.stringify(redactLogData(errData), null, 2)}`);
      req.flash('message', errData?.message || 'Error deleting SMTP configuration. Please try again.');
      req.flash('alertType', 'error');
      return res.redirect(frontend_api_urls.PHISHMAGNUS.SMTP_PHISHING.LIST);
    });
};
