

const frontend_api_urls = require("../../config/frontend_api_urls");
const { logger } = require("../../logger/logger");
const getApiClient = require('../../utility/api-client')


async function createSubscription(req, res, next) {
  logger.info(`[Create Subscription]: Incoming Request.`);
  const orgId = req?.user.organization_id || req.params.orgId;
  if (req.method === "GET") {

    logger.info(`[Create Subscription]: GET: Incoming Param ${JSON.stringify(req.params)}`);
    // const organizationUrl = `/organization/find/${orgId}`;
    const application_url = `/phm/commons/retrieve-applications`;
    const organizationDetailUrl = `/phm/commons/fetchOrganizationDetails/${orgId}`;
    const listSuperOrgAdminUrl = `/phm/commons/retrieve-list-of-super-org-admins/${orgId}`;
    const apiClient = getApiClient(req);

    return Promise.all([
      // apiClient.get(organizationUrl),
      apiClient.get(application_url),
      apiClient.get(organizationDetailUrl),
      apiClient.get(listSuperOrgAdminUrl)
    ])
      .then(([applicationResp, organizationResponse, superOrgAdminResponse]) => {
        // const org = respOrg.data.message;
        const { object: applications } = applicationResp.data;
        const { object: organization } = organizationResponse.data;
        const { object: superUsers } = superOrgAdminResponse.data;
        // console.log('##############33 ' + JSON.stringify(organization))
        // if (org !== null) {

        res.render("pages/subscription/create-subscription", {
          layout: 'layout/layout_center',
          enableSuiteManagementLeftMenu: true,
          organization,
          applications,
          Services: [],
          superUsers
        });
      })
      .catch((error) => {
        res.render("pages/product_suite_management/suite_management", {
          message: "Issue in request, contact to administrator",
          alertType: "error",
        });
      });
  }
  try {
    logger.info(`[Create Subscription]: POST: inside the post method of create subscription`);
    logger.info(`[Create Subscription]: POST: Incomig Body ${JSON.stringify(req.body)}`);
    const payload = {
      selectedApplication: parseInt(req.body?.selectedApplication || 0),
      durationDays: parseInt(req.body?.durationDays || 0),
      selectedPackage: parseInt(req.body.selectedPackage || 0),
      totalUserLicense: parseInt(req.body.totaluserlicense || 0),
      licenseStartDate: req.body.licenseStartDate,
      services: req.body.services.map(id => parseInt(id)),
      billAddress: req.body.billAddress,
      billCountry: parseInt(req.body.billCountry || 0),
      billState: parseInt(req.body.billState || 0),
      billCity: parseInt(req.body.billCity || 0),
      billPostalCode: req.body.billPostalCode,
      pymtDesc: req.body.pymtDesc,
      serviceCost: parseFloat(req.body.serviceCost || 0),
      packageCost: parseFloat(req.body.packageCost || 0),
      totalUsers: parseInt(req.body.totalUsers || 0),
      discount: parseFloat(req.body.discount || 0),
      ttlPayableAmt: parseFloat(req.body.ttlPayableAmt || 0),
      allocatedOrgAdminUser: parseInt(req.body?.allocatedOrgAdminUser || 0)
    };
    logger.info(`[Create Subscription]: POST: Printing Payload ${JSON.stringify(payload)}`);

    if (payload.selectedApplication === 0) {
      logger.warn(`[Create Subscription]: POST: User did not select the Application.`)
      return res.redirect(`/subscription/create/${orgId}?message=Select Application&alertType=error`);
    } else if (payload.services.length === 0) {
      logger.warn(`[Create Subscription]: POST: User did not select any services.`)
      return res.redirect(`/subscription/create/${orgId}?message=Select Atleast One Service&alertType=error`);
    } else if (payload.selectedPackage === 0 && payload.durationDays === 0) {
      logger.warn(`[Create Subscription]: POST: Package is empty and duration of day is not set to Zero.`)
      return res.redirect(`/subscription/create/${orgId}?message=Duration of Day minimum 1 day&alertType=error`);
    } else if (payload.allocatedOrgAdminUser === 0) {
      logger.warn(`[Create Subscription]: POST: Select atelast one organization user`)
      return res.redirect(`/subscription/create/${orgId}?message=Select atelast one organization user&alertType=error`);
    }

    const apiClient = getApiClient(req);
    const response = await apiClient.post(`/subscription/${orgId}`, payload);
    const data = response.data;
    req.flash("message", 'Subscription created successfully');
    req.flash("alertType", "success");
    logger.info(`[Create Subscription]: Subscription created successfully for organization id: ${orgId}`);
    return res.redirect(frontend_api_urls.PRODUCT_SUITE.Subscription.PROFILE(orgId));
  } catch (error) {
    logger.error("Error creating Subscription:" + error);
    req.flash("message", "Unable to create subscription");
    req.flash("alertType", "error");
    return res.redirect(frontend_api_urls.PRODUCT_SUITE.Subscription.CREATE(orgId));
  }
}

async function findAll(req, res, next) {
  res.render("pages/subscription/subscription-history", { enableSuiteManagementLeftMenu: true });
}

module.exports = {
  createSubscription,
  // updateSubscription,
  // deleteSubscription,
  // editSubscription,
  // listSubscriptions,
  // findSubscriptionByService,
  findAll,
};
