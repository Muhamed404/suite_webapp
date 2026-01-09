const express = require("express");
const router = express.Router();
const { renderFormController, submitFormController } = require("../controllers/campaign/sms/create-sms-campaign");
const { renderSMSCampaignReport } = require("../controllers/campaign/sms/render-sms-campaign-report");
const checkPermission = require("../../utility/check-permission");
const enums = require('../../contants/enum');
const { getSMSCampaignDetails } = require("../controllers/campaign/sms/render-campaign-detail-report");

const { getSMSCampaignInvitees } = require("../controllers/campaign/sms/retrieve-sms-campaign-invitees");

// List all SMS phishing campaigns
router.get("/create", checkPermission(enums.ModuleNames.Campaign_SMS, [enums.Access_Types.RWD_O]),
    renderFormController);

router.post("/create", checkPermission(enums.ModuleNames.Campaign_SMS, [enums.Access_Types.RWD_O]),
    submitFormController);


router.get("/report", checkPermission(enums.ModuleNames.Campaign_SMS, [enums.Access_Types.RWD_O, enums.Access_Types.R_O]),
    renderSMSCampaignReport);


router.get("/report/campaign/:campaignId", checkPermission(enums.ModuleNames.Campaign_SMS, [enums.Access_Types.RWD_O, enums.Access_Types.R_O]),
    getSMSCampaignDetails);

router.get('/:campaignId/invitees', checkPermission(enums.ModuleNames.Campaign_SMS, [enums.Access_Types.RWD_O, enums.Access_Types.R_O]),
getSMSCampaignInvitees);


module.exports = router;
