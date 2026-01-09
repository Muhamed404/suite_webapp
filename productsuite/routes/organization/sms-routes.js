const express = require("express");
const router = express.Router();
const checkPermission = require("../../../utility/check-permission");
const enums = require('../../../contants/enum');
const {  createSMSSettings } = require("../../controllers/sms/create-sms-settings-controller");
const { updateSMSSettings } = require("../../controllers/sms/update-sms-settings-controller");
const { retrieveSMSSettings } = require("../../controllers/sms/retrieve-sms-settings-controller");

// Below route is only for Setting up SMS settings for an organization

// Create SMS Settings
router.post("/settings/create/:organizationId", createSMSSettings);

// Retrieve SMS Settings by ID
router.get("/settings/:organizationId", retrieveSMSSettings);



module.exports = router;
