const express = require("express");
const router = express.Router();
const { validate, handleValidationResult } = require("../../../middleware/routes-validation");
const controller = require("../../controllers/smtp/smtp-controller");
const enums = require('../../../contants/enum');
const checkPermission = require("../../../utility/check-permission");


router.get("/test-connection/:organizationId?", checkPermission(enums.ModuleNames.Organization_Settings, [enums.Access_Types.RWD_ALL, enums.Access_Types.R_ALL, enums.Access_Types.RWD_O, enums.Access_Types.RW_O]), controller.testOrganizationSMTPConnection);
router.get("/:orgId?", checkPermission(enums.ModuleNames.Organization_Settings, [enums.Access_Types.RWD_ALL, enums.Access_Types.R_ALL, enums.Access_Types.RWD_O, enums.Access_Types.RW_O]), controller.createSMTP);

router.post("/:orgId", checkPermission(enums.ModuleNames.Organization_Settings, [enums.Access_Types.RWD_ALL, enums.Access_Types.R_ALL, enums.Access_Types.RWD_O, enums.Access_Types.RW_O]), validate("createSMTP"), handleValidationResult, controller.createSMTP);


// TEST SMTP CONNECTION 

module.exports = router;
