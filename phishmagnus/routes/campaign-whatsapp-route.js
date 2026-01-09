const express = require("express");
const router = express.Router();
const CreateWhatsappCampaignController = require("../controllers/campaign/whatsapp/CreateWhatsappCampaignController");
const RenderWhatsappCampaignDetailReportController = require("../controllers/campaign/whatsapp/RenderWhatsappCampaignDetailReportController");
const ReportWhatsappCampaignController = require("../controllers/campaign/whatsapp/ReportWhatsappCampaignController");
const InviteesReportController = require("../controllers/campaign/whatsapp/RetrieveWhatsappInviteesController");



const checkPermission = require("../../utility/check-permission");
const enums = require('../../contants/enum');


// List all SMS phishing campaigns
router.get("/create", checkPermission(enums.ModuleNames.Campaign_SMS, [enums.Access_Types.RWD_O]),
    CreateWhatsappCampaignController.renderFormController);

router.post("/create", checkPermission(enums.ModuleNames.Campaign_SMS, [enums.Access_Types.RWD_O]),
    CreateWhatsappCampaignController.submitFormController);

router.get("/report", checkPermission(enums.ModuleNames.Campaign_SMS, [enums.Access_Types.RWD_O, enums.Access_Types.R_O]),
    ReportWhatsappCampaignController.renderWhatsappCampaignReport);


router.get("/report/campaign/:campaignId", checkPermission(enums.ModuleNames.Campaign_SMS, [enums.Access_Types.RWD_O, enums.Access_Types.R_O]),
    RenderWhatsappCampaignDetailReportController.generateWhatsappCampaignDetails);

router.get('/:campaignId/invitees', checkPermission(enums.ModuleNames.Campaign_SMS, [enums.Access_Types.RWD_O, enums.Access_Types.R_O]),
InviteesReportController.generateWhatsappCampaignInviteesReport);


module.exports = router;
