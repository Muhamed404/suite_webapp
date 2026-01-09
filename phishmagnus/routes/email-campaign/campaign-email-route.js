const express = require("express");
const router = express.Router();
const controller = require("../../controllers/campaign/campaign-controller");
const { validate, handleValidationResult } = require("../../../middleware/routes-validation");
const enums = require('../../../contants/enum');
// const { renderEmailModule } = require("../../controllers/campaign/email/display-campaign");
const { createEmailCampaign } = require("../../controllers/campaign/email/create-email-campaign");
const {renderCampaignReport} = require('../../controllers/campaign/email/render-email-campaign-report')
const checkPermission = require("../../../utility/check-permission");
// const { emailReportCampaign } = require("../../controllers/campaign/email/email-report-campaign");
const { viewCampaignDetails } = require("../../controllers/campaign/email/view-email-campaign-details");
const { emailUserReport } = require("../../controllers/campaign/email/render-email-user-campaign-report");


//router.get("/usb/m/:orgId?", controller.viewUSBCampaignDetails);
//router.get("/view/usb-details/:campId/:orgId?", controller.viewUSBCampaignDetails);

// router.post("/test-campaign", controller.testCampaign);


router.get("/details/:campId", checkPermission(enums.ModuleNames.Campaign_Reports, [enums.Access_Types.RWD_O, enums.Access_Types.R_O]), 
viewCampaignDetails);


router.get("/user/report/:inviteeId/:campId", 
    checkPermission(enums.ModuleNames.Campaign_Reports, 
        [enums.Access_Types.RWD_O, enums.Access_Types.R_O]), 
emailUserReport);


router.get("/report", renderCampaignReport);

router.post("/", checkPermission(enums.ModuleNames.Campaign_Management, [enums.Access_Types.RWD_O]), createEmailCampaign);
router.get("/", checkPermission(enums.ModuleNames.Campaign_Management, [enums.Access_Types.RWD_O]), createEmailCampaign);

module.exports = router;
