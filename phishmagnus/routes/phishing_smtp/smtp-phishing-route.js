const express = require("express");
const router = express.Router();
// const { validate, handleValidationResult } = require("../../../middleware/routes-validation");
const { listOfPhishingSMTPController } = require("../../controllers/phishing_smtp/list-phishing-smtp-controller");
const { createSMTP } = require("../../controllers/phishing_smtp/create-phishing-smtp-controller");
const enums = require('../../../contants/enum');
const checkPermission = require("../../../utility/check-permission");


router.get("/list/:organizationId?", checkPermission(enums.ModuleNames.SMTP, [enums.Access_Types.RWD_ALL, enums.Access_Types.R_ALL, enums.Access_Types.RWD_O, enums.Access_Types.RW_O]), listOfPhishingSMTPController);
router.get("/create/:organizationId?", checkPermission(enums.ModuleNames.SMTP, [enums.Access_Types.RWD_ALL, enums.Access_Types.R_ALL, enums.Access_Types.RWD_O, enums.Access_Types.RW_O]), createSMTP);

// router.post("/:orgId", checkPermission(enums.ModuleNames.SMTP, [enums.Access_Types.RWD_ALL, enums.Access_Types.R_ALL, enums.Access_Types.RWD_O, enums.Access_Types.RW_O]), validate("createSMTP"), handleValidationResult, controller.createSMTP);

module.exports = router;
