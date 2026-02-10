const express = require("express");
const checkPermission = require("../../../utility/check-permission");
const router = express.Router();
const enums = require('../../../contants/enum');
const { renderProductSuite } = require("../../controllers/home/render_suite_management");
const { renderSuiteManagementDashboard } = require("../../controllers/home/render_suite_management_dashboard");
const { redirectToAwareMagnus } = require("../../controllers/home/redirect_to_awm");

router.get("/dashboard", renderSuiteManagementDashboard);
router.get("/redirect-to-awm", redirectToAwareMagnus);

router.get("/", checkPermission(enums.ModuleNames.Organization_Suite_Mgmt, [enums.Access_Types.R_ALL, enums.Access_Types.R_O]),
    renderProductSuite);




module.exports = router;