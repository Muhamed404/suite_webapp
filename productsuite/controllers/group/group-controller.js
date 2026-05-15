

const backend_api_urls = require("../../../config/backend_api_urls");
const render_ejs_urls = require("../../../config/render_ejs_urls");
const { logger } = require("../../../logger/logger");
const getApiClient = require('../../../utility/api-client')
const enums = require("../../../contants/enum");
const frontend_api_urls = require("../../../config/frontend_api_urls");
const { redactLogData } = require("../../../utility/redact");
exports.create = async (req, res) => {
  if (req.user === undefined || req?.user === undefined) {
    logger.warn('User session is undefined');
    req.flash('alertType', 'error');
    req.flash('message', 'Invalid user session');
    return res.redirect("/home");
  }
  const organization = req?.user.organization_id || null;
  if (organization === undefined || organization === null) {
    logger.warn('Organization ID is undefined');
    req.flash('alertType', 'error');
    req.flash('message', 'Invalid user organization session');
    return res.redirect("/home");
  }

  if (req.method === "GET") {
    logger.info(`[Gorup create]: Incoming request for organization ${organization}`)


    res.render(render_ejs_urls.PhishMagnus.Group_Management.CREATE, {
      enableSuiteManagementLeftMenu: true,
      organization,
      organizationName: req.query?.On || ''
    });

  } else if (req.method === "POST") {
    logger.info(`[Gorup create]: Post Incoming request for organization ${organization}`)

    let groups = {
      name: req.body.name,
      description: req.body.description,
      organization_id: organization
      // department_id: req.body.dept == 0 ? null : req.body.dept,
    };
    const apiClient = getApiClient(req);
    const url = backend_api_urls.PHISHMAGNUS.GROUPS.CREATE;

    try {
      logger.info('[Group create]: POST Payload: ' + JSON.stringify(redactLogData(groups), null, 2));
      const response = await apiClient.post(url, groups);
      const { message: message, alertType: alertType } = response.data;
      req.flash('alertType', alertType);
      req.flash('message', 'Group created successfully');
      logger.info(`[Group create]: Response from backend: ${JSON.stringify(redactLogData(response.data), null, 2)}`);

      res.redirect(
        frontend_api_urls.PHISHMAGNUS.Group.List
      );

    } catch (error) {
      logger.error(error.message);
      req.flash('alertType', 'error');
      req.flash('message', 'Error in creating Group');
      return res.redirect("/group/list");

    }
  }
};

exports.retrieveAllGroups = async (req, res) => {
  logger.info(`[Retrieve All Groups]: Incoming request with the params ${JSON.stringify(redactLogData(req.params))}`)
  if (req.method === "GET") {
    let orgId = req.user.organization_id === null ? parseInt(req.params.organizationId) : parseInt(req.user.organization_id);
    if (orgId === undefined || orgId === null) {
      logger.warn('Organization is undefined');
      req.flash('alertType', 'error');
      req.flash('message', 'Invalid user organization session');
      return res.redirect("/home");
    }

    const apiClient = getApiClient(req);
    const url = backend_api_urls.PHISHMAGNUS.GROUPS.FIND_GROUP_BY_ORGANIZATION(orgId);

    let subscriptionBalanceUrl = backend_api_urls.PRODUCT_SUITE.Subscription.Find_Balance_By_Organization(orgId);
    return Promise.all([apiClient.get(url), apiClient.get(subscriptionBalanceUrl)])
      .then(([response, subscriptionResponse]) => {
        const groups = response.data.message;
        let subscription = subscriptionResponse.data?.object

        // console.log('----------- ' + subscriptionOrgId)
        logger.info(`[Retrieve All Groups]: Subscription Balance ${JSON.stringify(redactLogData(subscription), null, 2)}`)
        res.render(render_ejs_urls.PhishMagnus.Group_Management.LIST, {
          enableSuiteManagementLeftMenu: true,
          groups,
          subscription,
          subscriptionOrganization: orgId,
          organizationName: req.query?.On || ''
        });
      })
      .catch((error) => {
        logger.error(`${redactLogData(error.message)}`);
        res.redirect("/phm/?message='Error'&alertType='error'");
      });
  } else {
    logger.error(`invalid url in groups findallbyorganization`);
    res.redirect("/phm/?message='Error'&alertType='error'");
  }
};
