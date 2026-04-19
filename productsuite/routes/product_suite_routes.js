const express = require('express');
const router = express.Router();
const protectedRouter = express.Router();
const authRoute = require('./auth/auth_route');
const homeRoute = require('./home/home_route');
const orderRoutes = require('./organization/order-route')
const orgRoutes = require('./organization/organization-routes')

const subscriptionRoutes = require('./organization/subscription-routes')
const packageRoute = require('./package/package-routes')
const smtpRoute = require('./organization/smtp-route')
const MFARoute = require('./mfa/mfa-route')
const ApplicationServiceRoute = require('./app_service/app_service_route')
const cybersecurityRoute = require('./cyber_security/cybersecurity-categories-route');
const checkPermission = require('../../utility/check-permission');
const licenseRoute = require('./license/license-route');
const ServiceRegistryRoutes = require('./service_registry/service-registry-route');
const enums = require('../../contants/enum')
const groupRoute = require('./group/group-route')
const organizationAuditLog = require('./audit/audit-log-route');
const SystemTemplate = require('./template/system/system-template-routes');
const DMSRoutes = require("./organization/domain-management-routes");
const userRoutes = require("./user/user-routes");
const SMSRoutes = require("./organization/sms-routes");
const notificationTemplateRoutes = require("./notification_template/notification-template-routes");
const notificationMailRoutes     = require("./notification_mail/notification-mail-routes");
const authenticateMiddleware = require('../../middleware/jwt_authenticator/jwt-authenticate-middleware');
const departmentRoute = require('./department/department-route')
const {validate, handleValidationResult} = require('../../middleware/routes-validation')
const { changePassword } = require("../controllers/auth/change_password_controller");

protectedRouter.use('/dms', DMSRoutes)
protectedRouter.use('/template', SystemTemplate)
protectedRouter.use('/sms', SMSRoutes)
protectedRouter.use('/notification-template', notificationTemplateRoutes)
protectedRouter.use('/notification-mail', notificationMailRoutes)
protectedRouter.use("/audit", organizationAuditLog);
protectedRouter.use('/department', departmentRoute)
protectedRouter.use("/service-registry", ServiceRegistryRoutes);
protectedRouter.use("/license", licenseRoute);
protectedRouter.use("/home", homeRoute);
protectedRouter.use("/suite_management_dashboard", homeRoute);
router.use("/login", authRoute);
protectedRouter.use('/package', packageRoute)
protectedRouter.use('/order', orderRoutes)

protectedRouter.use('/organization', orgRoutes)
protectedRouter.use('/subscription', subscriptionRoutes)
router.use('/mfa', MFARoute)
protectedRouter.use('/settings/smtp', smtpRoute)
protectedRouter.use('/app_service', ApplicationServiceRoute)
protectedRouter.use('/cybersecurity', cybersecurityRoute)
protectedRouter.use("/user", userRoutes);
protectedRouter.use('/group', groupRoute)

protectedRouter.get("/changePassword", changePassword);
protectedRouter.post("/changePassword", validate("changePassword"), handleValidationResult, changePassword);
router.use("/", authRoute);



router.use(authenticateMiddleware, protectedRouter);

module.exports = router;