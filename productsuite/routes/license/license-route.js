const express = require("express");
const router = express.Router();
const { logger } = require("../../../logger/logger");

const enums = require('../../../contants/enum')
const checkPermission = require("../../../utility/check-permission");
 
 
const LicenseController = require('../../controllers/license/license-controller')
 

// Retrieve licensed users based on selected product
// 1: Key = All
// 2: Key = PhishMagnus
// 3: Key = AwareMagnus
router.get("/retrieve/information/:selectedProductKey",
  checkPermission(enums.ModuleNames.User_Management, [enums.Access_Types.RWD_ALL, enums.Access_Types.RWD_O]),
  LicenseController.retrieveLicenseInformationByProductEnumKey)

module.exports = router;
