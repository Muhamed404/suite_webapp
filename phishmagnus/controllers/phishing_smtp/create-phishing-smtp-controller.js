const backend_api_urls = require("../../../config/backend_api_urls");
const config = require("../../../config/env.config");
const render_ejs_urls = require("../../../config/render_ejs_urls");

const { logger } = require("../../../logger/logger");
const getApiClient = require('../../../utility/api-client')


exports.createSMTP = async (req, res) => {
  logger.info(`Create Phishing SMTP Controller: Calling Incoming request to create phishing smtp method`);
  if (req.method === "GET") {
    let orgId = req.params?.orgId || 0;
    logger.info(`Create Phishing SMTP Controller: For organization code:- ${orgId}`);
    let organizationName = 'SecureMagnus Organization';
    const url = backend_api_urls.PRODUCT_SUITE.ORGANIZATION.Active_Organization_List;
    const apiClient = getApiClient(req);
    return res.render(render_ejs_urls.PhishMagnus.SMTP_PHISHING.CREATE, {
      enableSuiteManagementLeftMenu: true,
      Organization: organizationName,
      org: orgId,
      showOrgSelect: true,

    });
    logger.info(`Create Phishing SMTP Controller: Calling API URL:- ${url} `);
    apiClient
      .get(url)
      .then((response) => {
        const data = response.data;
        logger.info(`Create Phishing SMTP Controller: response data is ${JSON.stringify(data, null, 2)}`);


        // Resolve smtp from either payload shape:
        // Payload 1: { message: { name, SMTPConfigurations: [{ host, port, ... }] } }
        // Payload 2: { message: { host, port, ... } }
        let smtp = null;




      })
      .catch((error) => {
        logger.error(`issue in fetching create SMTP smtps`);
        logger.error(error.message);
        if (error.response && error.response.data) {
          logger.error(error.response.data);
        } else {
          logger.error(error);
        }
        res.redirect('/organization/profile/' + orgId + '?message=Error In SMTP Configuration&alertType=error')

      });
  } else {
    logger.info(`Calling post method of create smtp`);
    const { host, port, smtp_account, smtp_password, sender_email } = req.body;
    logger.info(`Incoming param body ${JSON.stringify(req.body, null, 2)}`);
    let orgId = Number(req.params.orgId);
    const smtpObj = {
      host,
      port,
      smtp_account,
      smtp_password,
      sender_email,
      organization_id: orgId,
    };
    const apiClient = getApiClient(req);
    const url = `/settings/smtp/` + orgId;
    logger.info(`:::::::::::${url}:::::::::::`);

    apiClient
      .post(url, smtpObj)
      .then((response) => {
        const data = response.data;
        logger.info(`response data is ${JSON.stringify(data)}`);
        if (data.alertType) {
          logger.info(`SMTP Account has created for organization` + orgId)
          req.flash('message', data.message);
          req.flash('alertType', data.alertType);
          if (orgId === 0) {
            res.redirect(`/settings/smtp/${orgId}`);
          } else {
            res.redirect(`/organization/profile/${orgId}`);
          }
        } else {
          // console.log(`else is rinn`);
          res.render("pages/settings/smtp/create-smtp");
        }
      })
      .catch((error) => {
        logger.error('Error in smtp post')
        logger.error(`${error.message}`);
        logger.error(error);
        logger.error(error.stack);
        req.flash('message', 'Error in SMTP Creation, Contact to Admin');
        req.flash('alertType', 'error');
        res.redirect(
          `/organization/profile/${orgId}`
        );
      });
  }
};