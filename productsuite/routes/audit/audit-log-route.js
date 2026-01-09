const express = require("express");
const router = express.Router();
const {viewLogs} = require("../../controllers/audit-log/view-log");

const checkPermission = require("../../../utility/check-permission");
const enums = require('../../../contants/enum')


router.get("/:organizationId?", checkPermission(enums.ModuleNames.Audit_Log, [enums.Access_Types.R_ALL]), 
viewLogs);


module.exports = router;
