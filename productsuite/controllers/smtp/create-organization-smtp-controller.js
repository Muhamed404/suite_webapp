const { logger } = require("../../../logger/logger");
const getApiClient = require('../../../utility/api-client')


exports.createSMTP = async (req, res) => {
  if (req.method === "GET") {
    let orgId = req.params?.orgId || 0;
    const url = `/settings/smtp/${orgId}`;
    logger.info(`[Create Organization SMTP] Calling backend API: ${url}`)
    const apiClient = getApiClient(req);
    apiClient
      .get(url)
      .then((response) => {
        const data = response.data;

        logger.debug(`[Create Organization SMTP] Response data: ${JSON.stringify(data, null, 2)}`);

        // Resolve smtp from either payload shape:
        // Payload 1: { message: { name, SMTPConfigurations: [{ host, port, ... }] } }
        // Payload 2: { message: { host, port, ... } }
        let smtp = null;
        let organizationName = 'SecureMagnus Organization';

        if (data.message.SMTPConfigurations && data.message.SMTPConfigurations.length > 0) {
          smtp = data.message.SMTPConfigurations[0];
          organizationName = data.message.name || organizationName;
        } else if (data.message.host) {
          smtp = data.message;
        }

        if (smtp) {
          logger.info(`[Create Organization SMTP] Rendering page`)
          res.render("pages/settings/smtp/create-smtp", {
            enableSuiteManagementLeftMenu: true,
            Organization: organizationName,
            org: orgId,
            host: smtp.host,
            port: smtp.port,
            smtp_account: smtp.smtp_account,
            smtp_password: smtp.smtp_password,
            isActive: smtp.is_active ? true : false,
            enableTestBtn: smtp.id ? true : false,
            sender_email: smtp.sender_email,
            sender_display_name: smtp.sender_display_name || '',
            use_tls: smtp.use_tls,
            use_ssl: smtp.use_ssl,
            for_phishing_smtp: smtp.for_phishing_smtp,
            encrypt_password: smtp.is_encrypted ? true : false,
            enable_mfa: smtp.enable_mfa ? true : false,
            is_authenticated: smtp.is_authenticated ? true : false
          });
        } else {
          logger.info(`[Create Organization SMTP] No Existing SMTP for Org ${orgId}`);
          organizationName = data.message.name;
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
        logger.error(`[Create Organization SMTP] Error in Retrieval`);
        logger.error(error.message);
        if (error.response && error.response.data) {
          logger.error(error.response.data);
        } else {
          logger.error(error);
        }
        res.redirect('/organization/profile/' + orgId + '?message=Error In SMTP Configuration&alertType=error')

      });
  } else {
    logger.info(`[Create Organization SMTP] POST: Incoming Request`);
    const { host, port, smtp_account, smtp_password, sender_email, sender_display_name, use_tls, use_ssl, encrypt_password = true, enable_mfa, is_authenticated } = req.body;
    logger.debug(`[Create Organization SMTP] POST: Incoming hostname ${JSON.stringify(req.body.host, null, 2)}`);
    let orgId = Number(req.params.orgId);
    const smtpObj = {
      host,
      port,
      smtp_account,
      smtp_password,
      sender_email,
      sender_display_name: sender_display_name || null,
      use_tls: use_tls === 'true',
      use_ssl: use_ssl === 'true',
      organization_id: orgId,
      is_encrypted: encrypt_password === 'true',
      enable_mfa: enable_mfa === 'true',
      is_authenticated: is_authenticated === 'true',
      is_active: true
    };
    const apiClient = getApiClient(req);
    const url = `/settings/smtp/` + orgId;
    logger.info(`[Create Organization SMTP] POST: Calling Backend api ${url}`)
    apiClient
      .post(url, smtpObj)
      .then((response) => {
        const data = response.data;
        
        if (data.alertType) {
          logger.info(`[Create Organization SMTP] POST: Organization ${orgId} SMTP Account created`)
          req.flash('message', 'SMTP configured fully');
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
        logger.error('[Create Organization SMTP] POST: Error in saving.')
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