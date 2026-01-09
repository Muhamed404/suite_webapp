const express = require("express");
const router = express.Router();
const controller = require("../../controllers/campaign/qr/qr-campaign-controller");
const { validate, handleValidationResult } = require("../../../middleware/routes-validation");
const { validateImageSize, uploadFileMulterMiddleware, conditionalFileUpload } = require("../../../middleware/campaign-multer-middleware");
const checkPermission = require("../../../utility/check-permission");
const enums = require('../../../contants/enum')

// Below are the old navigation links, here are the new links
router.get("/create", checkPermission(enums.ModuleNames.Campaign_Management, [enums.Access_Types.RWD_O]), controller.createCampaign);
router.post("/create", 
  checkPermission(enums.ModuleNames.Campaign_Management, [enums.Access_Types.RWD_O]), 
    express.urlencoded({ extended: true }), // Add this to parse form data when multer is skipped

  conditionalFileUpload, // This now handles both cases
  controller.submitForm
);
router.get("/report", controller.renderQRCampaignReport);
router.get("/details/:campId", checkPermission(enums.ModuleNames.Campaign_Reports, [enums.Access_Types.RWD_O, enums.Access_Types.R_O]), 
controller.viewQRCampaignDetails);
router.get("/download/:qrCode", checkPermission(enums.ModuleNames.Campaign_Management, [enums.Access_Types.RWD_O]), controller.downloadQRImage);

router.get("/tag/report/:campaignId/:qrImageCode", checkPermission(enums.ModuleNames.Campaign_Reports, [enums.Access_Types.RWD_O, enums.Access_Types.R_O]), 
controller.generateQRTagReport);



// below routes is for QR
// router.get("/view/:campId", checkPermission(enums.ModuleNames.Campaign_Reports, [enums.Access_Types.RWD_O, enums.Access_Types.R_O]), controller.viewQRCampaignDetail);
// router.get("/m/:orgId?", checkPermission(enums.ModuleNames.Campaign_Reports, [enums.Access_Types.RWD_O, enums.Access_Types.R_O]), controller.qrModule);
// // router.get("/completed/", checkPermission(enums.ModuleNames.Campaign_Reports, [enums.Access_Types.RWD_O, enums.Access_Types.R_O]), controller.qrReportCompletedCampaign);
// router.get("/qr-report/:orgId?", controller.nfcReportCampaign);

module.exports = router;
