

const { logger } = require("../../logger/logger");
const enums = require("../../contants/enum");
const { getUserInfo, canAccessOrganization, logAuthResult } = require("../../utility/authorization-helper");
const { redactLogData } = require("../../utility/redact");

const getApiClient = require('../../utility/api-client')


async function displayInvoice(req, res) {
  logger.info('ORDER INVOICE::: DISPLAY INVOICE REQUEST HAS RECEIVED')
  if (req.method === "GET") {
    const { organizationId, subscriptionId, orderId } = req.params;
    try {
      const orgIdNum = parseInt(organizationId, 10);
      if (isNaN(orgIdNum)) {
        logger.warn(`[Display Invoice]: Invalid organizationId: ${organizationId}`);
        const errMessage = "Invalid organization ID";
        return res.redirect(`/phm/index?message=${errMessage}&alertType=error`);
      }

      const userInfo = getUserInfo(req);
      const authResult = canAccessOrganization(userInfo, orgIdNum, enums.ModuleNames.Subscription_History);
      logAuthResult('View Invoice', userInfo, authResult, organizationId);

      if (!authResult.allowed) {
        logger.warn(`[Display Invoice]: User ${userInfo.userId} attempted unauthorized access to organization ${organizationId}'s invoice - Reason: ${authResult.reason}`);
        const errMessage = "Unauthorized: You do not have permission to view this invoice";
        return res.redirect(`/home?message=${errMessage}&alertType=error`);
      }

      logger.info(
        `INVOICE PARAMETERS org ${organizationId}, subscription ${subscriptionId}, order ${orderId}`
      );

      const url = `/order/invoice/${organizationId}/${subscriptionId}/${orderId}`;
      const apiClient = getApiClient(req);
      const response = await apiClient.get(url);
      // console.log(response)
      let invoiceData = response.data.message;
      logger.info(`received invoice data is \n ${JSON.stringify(redactLogData(invoiceData))}`);
      res.render("pages/order/invoice", { invoiceData, enums: enums, enableSuiteManagementLeftMenu: true, });
    } catch (error) {
      logger.error(`exception in displayInvoice \n`, error);
      const errMessage = "Error in Request, Contact to Administrator";
      res.redirect(`/phm/index?message=${errMessage}&alertType=error`);
    }
  }
}

async function updateInvoice(req, res) {
  let orgId;
  try {
    //let organizationId = req.user.organization_id;
    logger.info('Request has received in update invoice')
    logger.info(JSON.stringify(redactLogData(req.body)))
    let orderId = req.body.order;
    let subscriptionId = req.body.subscription;
    orgId = req.body.org;

    if (
      subscriptionId === null ||
      subscriptionId === undefined ||
      subscriptionId === "" ||
      orderId === null ||
      orderId === undefined ||
      orderId === ""
    ) {
      // Handle the case where subscriptionId is null, undefined, or empty
      logger.error("subscriptionId or orderId is null, undefined, or empty");
      throw new Error(`Update in invoice`);
    }
    const apiClient = getApiClient(req);
    let invoiceUrl = `/order/update-invoice/${orgId}/${subscriptionId}/${orderId}`;

    const [response] = await Promise.all([apiClient.post(invoiceUrl, req.body)]);

    const data = response.data;
    let message = data.message;
    let alertType = data.alertType;
    logger.info(`Response in update invoice : ${message} ${alertType}`);
    // res.redirect(
    //   `/organization/?message=${message}&alertType=${alertType}`
    // );
    res.redirect(
      `/organization/profile/${orgId}?message=${message}&alertType=${alertType}&tab=subscription`
    );
  } catch (error) {
    logger.error(`Exception in updateInvoice \n` + error);
    const errMessage = "Error in Request, Contact Administrator";
    res.redirect(`/organization/profile/${orgId}?message=${errMessage}&alertType=error&tab=subscription`);
  }
}

module.exports = {

  displayInvoice,
  updateInvoice,
};
