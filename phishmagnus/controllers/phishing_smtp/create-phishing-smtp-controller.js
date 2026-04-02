const backend_api_urls = require("../../../config/backend_api_urls");
const config = require("../../../config/env.config");
const frontend_api_urls = require("../../../config/frontend_api_urls");
const render_ejs_urls = require("../../../config/render_ejs_urls");

const { logger } = require("../../../logger/logger");
const getApiClient = require('../../../utility/api-client')


exports.createSMTP = async (req, res) => {
  logger.info(`[Rendering Phishing SMTP] Incoming Request`);
  const userOrganizationId = req.session?.user?.organization_id || 0;

  if (req.method === "GET") {
    let orgId = req.session?.user?.organization_id || 0;
    logger.info(`[Rendering Phishing SMTP] For organization code:- ${orgId}`);
    let organizationName = 'SecureMagnus Organization';
    const url = backend_api_urls.PRODUCT_SUITE.ORGANIZATION.Active_Organization_List;
    const apiClient = getApiClient(req);
    logger.info(`[Rendering Phishing SMTP] Calling Backend API URL:- ${url} `);
    apiClient
      .get(url)
      .then((response) => {
        const data = response.data;
        logger.info(`[Rendering Phishing SMTP] Response of organization received`);

        const organizations = data.success ? data.organizations : [];

        return res.render(render_ejs_urls.PhishMagnus.SMTP_PHISHING.CREATE, {
          enableSuiteManagementLeftMenu: true,
          Organization: organizationName,
          org: orgId,
          showOrgSelect: true,
          organizations,
          actionUrl: frontend_api_urls.PHISHMAGNUS.SMTP_PHISHING.Create_Action_URL(orgId),
          homeUrl: frontend_api_urls.PHISHMAGNUS.Home.INDEX,
        });
      })
      .catch((error) => {
        logger.error(`[Rendering Phishing SMTP] Error in fetching backend api response`);
        logger.error(error.message);
        if (error.response && error.response.data) {
          logger.error(error.response.data);
        } else {
          logger.error(error);
        }
        req.flash('message', 'Error in fetching organization list, Contact to Admin');
        req.flash('alertType', 'error');
        return res.redirect(frontend_api_urls.PHISHMAGNUS.SMTP_PHISHING.CREATE);
      });
  } else if (req.method === "POST") {
    logger.info(`[Rendering Phishing SMTP] POST:- Calling post method of create smtp`);
    const { host, port, smtp_account, smtp_password, sender_email, selected_org, details, use_tls, use_ssl, encrypt_password = false } = req.body;
    // logger.info(`Incoming param body ${JSON.stringify(req.body, null, 2)}`);
    // let orgId = Number(selected_org) || req.session?.user?.organization_id || 0;
    const smtpObj = {
      host,
      port,
      smtp_account,
      smtp_password,
      sender_email,
      organization_id: selected_org,
      details,
      use_tls: use_tls === 'true',
      use_ssl: use_ssl === 'true',
      is_encrypted: encrypt_password === 'true'
    };
    const apiClient = getApiClient(req);
    const url = backend_api_urls.PHISHMAGNUS.PHISHING_SMTP.CREATE(selected_org);
    logger.info(`[Rendering Phishing SMTP] POST:- Calling API URL:- ${url} with body ${smtpObj.smtp_account}`);

    apiClient
      .post(url, smtpObj)
      .then((response) => {
        const data = response.data;
        logger.info(`[Rendering Phishing SMTP] POST:- Response ${JSON.stringify(data)}`);

        if (data.success) {
          logger.info(`[Rendering Phishing SMTP] POST:- SMTP Account created successfully for organization ${selected_org}`);
          req.flash('message', data.message);
          req.flash('alertType', 'success');
          return res.redirect(frontend_api_urls.PHISHMAGNUS.SMTP_PHISHING.LIST);
        } else {
          logger.warn(`[Rendering Phishing SMTP] POST:- Failed to create SMTP Account for organization ${selected_org}. Response message: ${data.message}`);
          req.flash('message', data.message || 'Failed to create SMTP Account');
          req.flash('alertType', 'error');
          return res.redirect(frontend_api_urls.PHISHMAGNUS.SMTP_PHISHING.CREATE);
        }
      })
      .catch((error) => {
        logger.error('[Rendering Phishing SMTP] POST:- Error in creating SMTP Account');
        logger.error(`${error.message}`);
        logger.error(error);
        logger.error(error.stack);
        req.flash('message', 'Error in Phising SMTP Creation, Contact to Admin');
        req.flash('alertType', 'error');
        return res.redirect(frontend_api_urls.PHISHMAGNUS.SMTP_PHISHING.LIST);

      });
  }
};