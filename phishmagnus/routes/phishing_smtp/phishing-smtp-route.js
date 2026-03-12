const express = require("express");
const router = express.Router();
// const { validate, handleValidationResult } = require("../../../middleware/routes-validation");
const { listOfPhishingSMTPController } = require("../../controllers/phishing_smtp/list-phishing-smtp-controller");
const { listOfPhishingSMTPNameController } = require("../../controllers/phishing_smtp/list-phishing-smtp-name-controller");
const { createSMTP } = require("../../controllers/phishing_smtp/create-phishing-smtp-controller");
const { editPhishingSMTP } = require("../../controllers/phishing_smtp/edit-phishing-smtp-controller");
const { deletePhishingSMTP } = require("../../controllers/phishing_smtp/delete-phishing-smtp-controller");
const { testPhishingSMTP } = require("../../controllers/phishing_smtp/test-phishing-smtp-controller");
const enums = require('../../../contants/enum');
const checkPermission = require("../../../utility/check-permission");


router.get("/list", checkPermission(enums.ModuleNames.SMTP, [enums.Access_Types.RWD_ALL, enums.Access_Types.R_O]), listOfPhishingSMTPController);
router.get("/name", checkPermission(enums.ModuleNames.SMTP, [enums.Access_Types.RWD_ALL, enums.Access_Types.R_O, ]), listOfPhishingSMTPNameController);
router.get("/create/:organizationId?", checkPermission(enums.ModuleNames.SMTP, [enums.Access_Types.RWD_ALL]), createSMTP);
router.post("/create/:organizationId?", checkPermission(enums.ModuleNames.SMTP, [enums.Access_Types.RWD_ALL ]), createSMTP);

router.get("/edit/:smtpId", checkPermission(enums.ModuleNames.SMTP, [enums.Access_Types.RWD_ALL ]), editPhishingSMTP);
router.post("/edit/:smtpId", checkPermission(enums.ModuleNames.SMTP, [enums.Access_Types.RWD_ALL ]), editPhishingSMTP);

router.get("/delete/:smtpId", checkPermission(enums.ModuleNames.SMTP, [enums.Access_Types.RWD_ALL]), deletePhishingSMTP);

router.get("/test-connection/:smtpId", checkPermission(enums.ModuleNames.SMTP, [enums.Access_Types.RWD_ALL, enums.Access_Types.R_O ]), testPhishingSMTP);

module.exports = router;
