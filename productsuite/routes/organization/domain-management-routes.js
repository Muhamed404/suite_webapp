const express = require("express");
const router = express.Router();
const controller = require("../../controllers/organization/domain-management/index");
const checkPermission = require("../../../utility/check-permission");
const enums = require('../../../contants/enum')

// Domain management
router.get("/:orgId/organization", checkPermission(enums.ModuleNames.Domain_Management, [enums.Access_Types.RWD_ALL]), controller.listDomains);
router.post("/create", checkPermission(enums.ModuleNames.Domain_Management, [enums.Access_Types.RWD_ALL]), controller.createDomain);
router.post("/edit/:domainOrgId", checkPermission(enums.ModuleNames.Domain_Management, [enums.Access_Types.RWD_ALL]), controller.editDomain);
router.get("/delete/:domainOrgId/organization/:domainId/domain", checkPermission(enums.ModuleNames.Domain_Management, [enums.Access_Types.RWD_ALL]), controller.deleteDomain);

// router.get("/toggle/:domainOrgId/domain/:domainId/:isActive", checkPermission(enums.ModuleNames.Domain_Management, [enums.Access_Types.RWD_ALL]), controller.toggleDomain);
router.get("/restrict/:orgId/:isActive", checkPermission(enums.ModuleNames.Domain_Management, [enums.Access_Types.RWD_ALL]), controller.toggleRestrict);



module.exports = router;
