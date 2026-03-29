const express = require("express");
const checkPermission = require("../../../utility/check-permission");
const enums = require("../../../contants/enum");
const {
  renderLdapPage,
  saveLdapConfig,
  triggerManualSync,
} = require("../../controllers/ldap/ldap-settings-controller");

const router = express.Router();

const permission = checkPermission(enums.ModuleNames.Organization_Settings, [
  enums.Access_Types.RWD_ALL,
  enums.Access_Types.R_ALL,
  enums.Access_Types.RWD_O,
  enums.Access_Types.RW_O,
]);

router.get("/:orgId?", permission, renderLdapPage);
router.post("/:orgId", permission, saveLdapConfig);
router.post("/:orgId/sync", permission, triggerManualSync);

module.exports = router;