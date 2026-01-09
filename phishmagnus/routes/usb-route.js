const express = require("express");
const router = express.Router();
// const controller = require("../controllers/campaign/usb/usb-controller")
const checkPermission = require("../../utility/check-permission");
const enums = require('../../contants/enum');
const { usbCampaignReport } = require("../controllers/campaign/usb/usb-campaign-report-controller");
const { usbCampaignViewReport } = require("../controllers/campaign/usb/usb-campaign-view-report-controller");
const { createUSBCampaign } = require("../controllers/campaign/usb/create-usb-campaign");
const { createAndDownloadUSBCampaignZipFile } = require("../controllers/campaign/usb/usb-phishing-generation-code");

router.post("/create", checkPermission(enums.ModuleNames.Campaign_Management, [enums.Access_Types.RWD_O]),createUSBCampaign);
router.get("/report", checkPermission(enums.ModuleNames.Campaign_Management, [enums.Access_Types.RWD_O]), usbCampaignReport);
router.get("/report-view/:campaignIdentifier", checkPermission(enums.ModuleNames.Campaign_Management, [enums.Access_Types.RWD_O]), usbCampaignViewReport);
router.get("/", checkPermission(enums.ModuleNames.Campaign_Management, [enums.Access_Types.RWD_O]), createUSBCampaign);

router.get("/package/download/:campId/:usbCode", checkPermission(enums.ModuleNames.Campaign_Management, [enums.Access_Types.RWD_O]), createAndDownloadUSBCampaignZipFile);


module.exports = router;
