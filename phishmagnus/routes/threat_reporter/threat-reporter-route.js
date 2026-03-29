const express = require("express");
const router = express.Router();
const enums = require('../../../contants/enum');
const checkPermission = require("../../../utility/check-permission");
const { renderReportedEmails } = require('../../controllers/campaign/threat_reporter/render-reported-emails');
const { renderReportedEmailDetail } = require('../../controllers/campaign/threat_reporter/render-reported-email-detail');
const { renderReportByInvitee } = require('../../controllers/campaign/threat_reporter/render-reported-byInvtee');
router.get("/list",
    checkPermission(enums.ModuleNames.Campaign_Reports, [enums.Access_Types.RWD_O, enums.Access_Types.R_O]),
    renderReportedEmails);

router.get("/:reportId/detail",
    checkPermission(enums.ModuleNames.Campaign_Reports, [enums.Access_Types.RWD_O, enums.Access_Types.R_O]),
    renderReportedEmailDetail);

router.get("/:invId/invitee",
    checkPermission(enums.ModuleNames.Campaign_Reports, [enums.Access_Types.RWD_O, enums.Access_Types.R_O]),
    renderReportByInvitee);


module.exports = router;
