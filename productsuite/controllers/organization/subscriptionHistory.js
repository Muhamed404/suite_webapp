
const config = require("../../../config/env.config");
const { logger } = require("../../../logger/logger");
const { isOrganizationAdmins } = require("../../../commons/commons");
const enums = require("../../../contants/enum");
const moment = require("moment");
const currentDate = moment().format("YYYY-MM-DD");
const getApiClient = require('../../../utility/api-client')
const { redactLogData } = require("../../../utility/redact");


exports.subscriptionHistory = async (req, res) => {
  try {
    logger.info("[Subscription History]: Incoming request in subscription History");
    let displayInvoiceButton = false;
    const apiClient = getApiClient(req);
    let paymentTypesEndpoint = `/phm/commons/getPaymentTypes`;
    let paymentStatusEndpoint = `/phm/commons/getPaymentStatus`;
    let viewProfileUrl = `/organization/subscription-history`;
    const [resTypes, resStatus, subscriptionHistory] = await Promise.all([
      apiClient.get(paymentTypesEndpoint),
      apiClient.get(paymentStatusEndpoint),
      apiClient.get(viewProfileUrl),
    ]);

    const paymentTypes = resTypes.data.paymentMethod;
    const paymentStatus = resStatus.data.paymentStatus;
    logger.info(`subscriptionHistory: ${JSON.stringify(redactLogData(subscriptionHistory.data), null, 2)}`);
    const { message, object } = subscriptionHistory.data;
    logger.info(`Payment types: ${JSON.stringify(redactLogData(paymentTypes))}`);
    logger.info(`Payment status: ${JSON.stringify(redactLogData(paymentStatus))}`);
    logger.info(`Payment status: ${JSON.stringify(redactLogData(paymentStatus))}`);
    logger.info(`[Subscription History]: Stats: ${JSON.stringify(redactLogData(object), null, 2)}`);
    const orderStatusNames = {
      [enums.orderStatus.Active]: req.__("Active"),
      [enums.orderStatus.SubscriptionCancelled]: req.__("SubscriptionCancelled"),
      [enums.orderStatus.Cancelled]: req.__("SubscriptionInvoiceCancelled"),
      [enums.orderStatus.GenerateInvoice]: req.__("GenerateInvoice"),
      [enums.orderStatus.PendingInvoice]: req.__("PendingInvoice"),
      [enums.orderStatus.CreateOrder]: req.__("CreateOrder"),
      [enums.orderStatus.SubscriptionExpired]: req.__("SubscriptionExpired"),
    };
    const paymentStatusNames = {
      [enums.paymentStatus.BankProgress]: req.__("Enums.BankProgress"),
      [enums.paymentStatus.Unpaid]: req.__("Enums.Unpaid"),
      [enums.paymentStatus.InProgress]: req.__("Enums.InProgress"),
      [enums.paymentStatus.Disputed]: req.__("Enums.Disputed"),
      [enums.paymentStatus.Cancelled]: req.__("Enums.Cancelled"),
      [enums.paymentStatus.Free]: req.__("Enums.Free"),
      [enums.paymentStatus.Paid]: req.__("Enums.Paid"),
    };

    const paymentStatusLabelClass = {
      [enums.paymentStatus.BankProgress]: "label-warning",
      [enums.paymentStatus.Unpaid]: "label-warning",
      [enums.paymentStatus.InProgress]: "label-warning",
      [enums.paymentStatus.Disputed]: "label-warning",
      [enums.paymentStatus.Cancelled]: "label-warning",
      [enums.paymentStatus.Free]: "label-success",
      [enums.paymentStatus.Paid]: "label-success",
    };
    //logger.info(data);
    res.render("pages/subscription/subscription-history", {
      enableSuiteManagementLeftMenu: true, // to hide product menu & show suite management menu
      history: object.history,
      stats: object.stats,
      orderStatusNames,
      paymentStatusNames,
      paymentStatusLabelClass,
      enums: enums,
      paymentTypes,
      paymentStatus,
      currentDate,
      displayInvoiceButton,
      user: req.user,
      isSecureMagnusAdmin: req.user?.organization_id === null
    });
  } catch (error) {
    logger.error("Error listing subscription History:", redactLogData(error));
    res.redirect("/phm/");
  }
}