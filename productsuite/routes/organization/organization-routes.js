const express = require("express");
const { body, param, validationResult } = require("express-validator");
const router = express.Router();
const organizationController = require("../../controllers/organization/organization-controller");
const checkPermission = require("../../../utility/check-permission");
const enums = require('../../../contants/enum')



const { validate, handleValidationResult } = require("../../../middleware/routes-validation");
// all organization view 
router.get("/", checkPermission(enums.ModuleNames.Organization, [enums.Access_Types.RWD_ALL, enums.Access_Types.R_ALL, enums.Access_Types.R_O]), organizationController.listOrganizations);
router.get("/profile/:orgId?", checkPermission(enums.ModuleNames.Organization, [enums.Access_Types.R_O, enums.Access_Types.R_ALL, enums.Access_Types.RWD_ALL]), validate("validateOrgId"), handleValidationResult, organizationController.viewProfile);

router.get("/create", checkPermission(enums.ModuleNames.Organization, [enums.Access_Types.RWD_ALL]), organizationController.createOrganization);

router.post("/", validate("validateCreateOrganization"), handleValidationResult, organizationController.createOrganization);

router.post("/edit/:organizationId", checkPermission(enums.ModuleNames.Organization_Settings, [enums.Access_Types.RWD_ALL, enums.Access_Types.RWD_O, enums.Access_Types.RW_O]), organizationController.editOrganization);

router.get("/edit/:organizationId", checkPermission(enums.ModuleNames.Organization_Settings, [enums.Access_Types.RWD_ALL,enums.Access_Types.R_ALL, enums.Access_Types.RWD_O, enums.Access_Types.RW_O]), organizationController.editOrganization);

router.get("/subscription-history", checkPermission(enums.ModuleNames.Subscription_History, [enums.Access_Types.R_O]), organizationController.subscriptionHistory);

router.get("/statistics/:orgId", organizationController.organizationalStatistics)

// router.get("/sms/:orgId", organizationController.organizationalStatistics)

module.exports = router;
