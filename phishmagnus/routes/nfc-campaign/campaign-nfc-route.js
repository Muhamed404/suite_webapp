const express = require("express");
const router = express.Router();
const controller = require("../../controllers/campaign/nfc/campaign-controller");
const enums = require('../../../contants/enum');
const checkPermission = require("../../../utility/check-permission");



router.get("/create", checkPermission(enums.ModuleNames.Campaign_Management, [enums.Access_Types.RWD_O]), controller.createNFCCampaign);
router.post("/create", checkPermission(enums.ModuleNames.Campaign_Management, [enums.Access_Types.RWD_O]), controller.createNFCCampaign);
router.get("/report", controller.renderCampaignReport);
router.get("/details/:campId", checkPermission(enums.ModuleNames.Campaign_Reports, [enums.Access_Types.RWD_O, enums.Access_Types.R_O]), 
controller.viewNFCCampaignDetails);
router.get("/device/report/:campaignId/:qrImageCode", checkPermission(enums.ModuleNames.Campaign_Reports, [enums.Access_Types.RWD_O, enums.Access_Types.R_O]), 
controller.generateNFCDeviceReport);

// below routes is for NFC
// router.get("/nfc/m", checkPermission(enums.ModuleNames.Campaign_Reports, [enums.Access_Types.RWD_O]), controller.nfcModule);
// When user click on completed nfc campaign Tabs
// router.get("/nfc/completed/", checkPermission(enums.ModuleNames.Campaign_Reports, [enums.Access_Types.RWD_O]), controller.nfcReportCompletedCampaign);

// router.get("/nfc/view/details/:campId", checkPermission(enums.ModuleNames.Campaign_Reports, [enums.Access_Types.RWD_O]), controller.nfcViewCampaignDetails);

// router.get("/view", (req, res) => { res.render(render_ejs_urls.PhishMagnus.Campaign.NFC.VIEW); }); // Redirect to home if someone tries to access without campaign id


module.exports = router;
