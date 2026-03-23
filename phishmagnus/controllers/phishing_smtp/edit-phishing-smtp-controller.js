const backend_api_urls = require("../../../config/backend_api_urls");
const frontend_api_urls = require("../../../config/frontend_api_urls");
const render_ejs_urls = require("../../../config/render_ejs_urls");
const { logger } = require("../../../logger/logger");
const getApiClient = require('../../../utility/api-client');


exports.editPhishingSMTP = async (req, res) => {
  const smtpId = req.params.smtpId;
  logger.info(`Edit Phishing SMTP Controller: Incoming request for smtp id ${smtpId}`);

  if (req.method === 'GET') {
    const apiClient = getApiClient(req);
    const url = backend_api_urls.PHISHMAGNUS.PHISHING_SMTP.DETAIL(smtpId);
    logger.info(`Edit Phishing SMTP Controller: GET - Fetching detail from ${url}`);

    apiClient
      .get(url)
      .then((response) => {
        const data = response.data;
        logger.debug(`Edit Phishing SMTP Controller: GET - Response ${JSON.stringify(data, null, 2)}`);

        // const smtp = data.smtp ?? data;
        const smtp = { ...data.smtp, encrypt_password: data.smtp.is_encrypted ? true : false }; // Ensure encrypt_password is set for the view
        return res.render(render_ejs_urls.PhishMagnus.SMTP_PHISHING.EDIT, {
          smtp,
          actionUrl: frontend_api_urls.PHISHMAGNUS.SMTP_PHISHING.EDIT(smtpId),
        });
      })
      .catch((error) => {
        logger.error(`Edit Phishing SMTP Controller: GET - Error fetching smtp detail: ${error.message}`);
        req.flash('message', 'Error fetching SMTP details. Please try again.');
        req.flash('alertType', 'error');
        return res.redirect(frontend_api_urls.PHISHMAGNUS.SMTP_PHISHING.LIST);
      });

  } else if (req.method === 'POST') {
    // console.log('Request body:'+ JSON.stringify(req.body, null, 2)); // Debug log to check incoming data
    const { host, port, smtp_account, smtp_password, sender_email, is_active, details, use_tls, use_ssl, encrypt_password = false } = req.body;
    const smtpObj = { host, port, smtp_account, smtp_password, sender_email, is_active: is_active === 'true', details, use_tls: use_tls === 'true', use_ssl: use_ssl === 'true', is_encrypted: encrypt_password === 'true' };

    const apiClient = getApiClient(req);
    const url = backend_api_urls.PHISHMAGNUS.PHISHING_SMTP.UPDATE(smtpId);
    logger.info(`Edit Phishing SMTP Controller: POST - Saving to ${url}`);

    apiClient
      .put(url, smtpObj)
      .then((response) => {
        const data = response.data;
        logger.debug(`Edit Phishing SMTP Controller: POST - Response ${JSON.stringify(data, null, 2)}`);

        req.flash('message', data.message || 'SMTP configuration updated successfully.');
        req.flash('alertType', data.success ? 'success' : 'error');
        return res.redirect(frontend_api_urls.PHISHMAGNUS.SMTP_PHISHING.LIST);
      })
      .catch((error) => {
        logger.error(`Edit Phishing SMTP Controller: POST - Error updating smtp: ${error.message}`);
        req.flash('message', 'Error updating SMTP configuration. Please try again.');
        req.flash('alertType', 'error');
        return res.redirect(frontend_api_urls.PHISHMAGNUS.SMTP_PHISHING.EDIT(smtpId));
      });
  }
};
