const express = require('express');
const router = express.Router();
const authRoutes = require("./login/auth-routes");
const indexRoutes = require("./index.route");
const commonsRoute = require('./common-function-routes')
// const templateRoute = require('./template/templates-route')
const templateRoute = require('../routes/template/my-template-route')
const fileRoute = require('./file-route/file-route')
const campaignRoute = require('./email-campaign/campaign-email-route')
const usbRoute = require('./usb-route')
const QRRoute = require('./qr-campaign/campaign-qr-route')
const SMSRoute = require('./campaign-sms-route');
const WhatsAppRoute = require('./campaign-whatsapp-route');
const checkPermission = require('../../utility/check-permission');
const enums = require('../../contants/enum')
const protectedRouter = express.Router();
const nfcCampaignRoute = require('./nfc-campaign/campaign-nfc-route')
const authenticateMiddleware = require('../../middleware/jwt_authenticator/jwt-authenticate-middleware');
const { renderAllCampaigns } = require('../controllers/campaign/render-all-campaigns');
const { renderAllReports } = require('../controllers/campaign/render-all-reports');
const PhishingSMTPRoute = require('./phishing_smtp/smtp-phishing-route');
router.use((req, res, next) => {
    console.log('[ROUTE] PhishMagnus route used:', req.method, req.originalUrl);
    next();
});


router.use("/login", authRoutes);

protectedRouter.use('/commons', commonsRoute)
protectedRouter.use('/file', fileRoute)
// protectedRouter.use('/settings/templates', templateRoute)
protectedRouter.use('/template', templateRoute)
protectedRouter.use('/campaign/qr', QRRoute)
protectedRouter.use('/campaign/sms', SMSRoute)
protectedRouter.use('/campaign/whatsapp', WhatsAppRoute)
protectedRouter.use('/campaign/usb', usbRoute)
protectedRouter.use('/campaign/nfc', nfcCampaignRoute)
protectedRouter.use('/campaign/email', campaignRoute)
protectedRouter.get('/campaign/all-campaigns', renderAllCampaigns)
protectedRouter.get('/campaign/reports', checkPermission(enums.ModuleNames.Campaign_Reports, [enums.Access_Types.R_ALL, enums.Access_Types.R_O]), renderAllReports)
protectedRouter.use("/phishing-smtp", PhishingSMTPRoute);
protectedRouter.use("/", indexRoutes);


router.use(authenticateMiddleware, protectedRouter);
module.exports = router;
