const config = require("../../../config/env.config");

const { logger } = require("../../../logger/logger");
const getApiClient = require('../../../utility/api-client')


exports.createSMTP = async (req, res) => {
  logger.info(`Calling create smtp method`);
  if (req.method === "GET") {
    let orgId = req.params.orgId;
    const url = `/settings/smtp/${orgId}`;
    const apiClient = getApiClient(req);
    logger.info(`:::::::::::${url}:::::::::::`);
    apiClient
      .get(url)
      .then((response) => {
        const data = response.data;
        logger.info(`data is ${JSON.stringify(data)}`);

        logger.info(`${JSON.stringify(data.message)}`);
        if (
          data.message.SMTPConfigurations &&
          data.message.SMTPConfigurations.length > 0
        ) {
          let smtp = data.message?.SMTPConfigurations[0];
          let organizationName = data.message.name;
          logger.info(`SMTP DATA HAS FOUND ${JSON.stringify(smtp)}`);
          logger.info(`Organization Name for smtp ${organizationName}`);
          // console.log(smtp);
          // console.log(smtp.is_active);
          res.render("pages/settings/smtp/create-smtp", {
            enableSuiteManagementLeftMenu: true,
            Organization: organizationName,
            org: orgId,
            host: smtp.host,
            port: smtp.port,
            smtp_account: smtp.smtp_account,
            smtp_password: smtp.smtp_password,
            isActive: smtp.is_active ? true : false,
            enableTestBtn: smtp.id ? true : false
          });
        } else {
          logger.info(`NO SMTP DATA HAS FOUND`);
          let organizationName = data.message.name;
          res.render("pages/settings/smtp/create-smtp", {
            enableSuiteManagementLeftMenu: true,
            Organization: organizationName,
            org: orgId,
            isActive: false,
            enableTestBtn: false
          });
        }
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
    const { host, port, smtp_account, smtp_password, domain } = req.body;
    logger.info(`Incoming param body ${JSON.stringify(req.body, null, 2)}`);
    let orgId = req.params.orgId;
    const smtpObj = {
      host,
      port,
      smtp_account,
      smtp_password,
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
          res.redirect(`/organization/profile/${orgId}`);
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