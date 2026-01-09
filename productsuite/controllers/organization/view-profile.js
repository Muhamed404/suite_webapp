const config = require("../../../config/env.config");
const { logger } = require("../../../logger/logger");
const { hasAccess } = require("../../../utility/helperFunctions");
const enums = require("../../../contants/enum");
const { currentDate } = require('../../../phishmagnus/utility/common-functions')
const getApiClient = require('../../../utility/api-client')


exports.viewProfile = async (req, res) => {
    try {
        logger.info('PROFILE VIEW METHOD::: INCOMING REQUEST')

        let orgId = req.params?.orgId || req.user.organization_id;
        // let sessionRoleId = req.user.role.id;
        // let userOrganization = req.user.organization_id;
        // let userRoleId = req.user.role.id;
        let allowUpdateInvoice = false
        let isPermitToCreateInvoice = false
        let hasAllowedCreateOrder = false;
        let hasPermitToUpdateProfile = Boolean(false);
        logger.info(`[PROFILE VIEW METHOD]: PARAMS ${JSON.stringify(req.params)}`);
        // const hasAccess = hasCreateAccess(req, enums.ModuleNames.Organization, [enums.Access_Types.RWD_ALL]);
        if (hasAccess(req, enums.ModuleNames.Organization, [enums.Access_Types.RWD_ALL])) {
            logger.info(`[PROFILE VIEW METHOD]: USER HAS PERMISSION TO UPDATE INVOICE/CREATE STATUS `);
            isPermitToCreateInvoice = true;
            allowUpdateInvoice = true;
            hasAllowedCreateOrder = true;
        }
        if (hasAccess(req, enums.ModuleNames.Organization_Settings, [
            enums.Access_Types.RWD_O,
            enums.Access_Types.RW_O,
            enums.Access_Types.RWD_ALL])) {
            logger.info(`[PROFILE VIEW METHOD]: USER HAS PERMISSION TO UPDATE ORGANIZATION PROFILE`);
            hasPermitToUpdateProfile = Boolean(true);
        }

        logger.info('[PROFILE VIEW METHOD]:: ORGANIZATION ID' + orgId)
        let paymentTypesEndpoint = `/phm/commons/getPaymentTypes`;
        let paymentStatusEndpoint = `/phm/commons/getPaymentStatus`;
        let viewProfileUrl = `/organization/profile/${orgId}`;
        logger.info('[PROFILE VIEW METHOD]:: LOGGING URL ' + viewProfileUrl)

        const apiClient = getApiClient(req);
        const [resTypes, resStatus, profileResponse] = await Promise.all([
            apiClient.get(paymentTypesEndpoint),
            apiClient.get(paymentStatusEndpoint),
            apiClient.get(viewProfileUrl),
        ]);

        const paymentTypes = resTypes.data?.paymentMethod;
        const paymentStatus = resStatus.data?.paymentStatus;
        const profile = profileResponse.data?.message;
        logger.info(`[PROFILE VIEW METHOD]: Profile Data: ${JSON.stringify(profile)}`);
        logger.info(`Payment types: ${JSON.stringify(paymentTypes)}`);
        logger.info(`Payment status: ${JSON.stringify(paymentStatus)}`);
        // Extract payment_status_id
        // const paymentStatusId = profile.Subscription?.[0]?.SubscriptionOrder?.[0]?.payment_status_id;
        // logger.info(`[PROFILE VIEW METHOD]:paymentStatusId: ${paymentStatusId}`);
        // Get the name or fallback to 'Not found'
        //const paymentStatusName = enums.paymentStatusById[paymentStatusId] || enums.paymentStatusById[2];
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

        res.render("pages/organization/profile-organization", {
            enableSuiteManagementLeftMenu: true,
            hasPermitToUpdateProfile,
            hasAllowedCreateOrder,
            isPermitToCreateInvoice,
            profile, 
            orderStatusNames,
            paymentStatusNames,
            paymentStatusLabelClass, 
            enums, 
            paymentTypes, 
            paymentStatus, 
            currentDate,
            allowUpdateInvoice, 
            
        });
    } catch (error) {
        logger.error('[PROFILE VIEW METHOD]:EXCEPTION: ' + error)
        logger.error('[PROFILE VIEW METHOD]:STACK: ' + error.stack)
        //res.status(error.response.status).json(error.response.data);
        res.redirect("/phm/");
    }
}