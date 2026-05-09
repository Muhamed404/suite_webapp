const { body, validationResult, param } = require("express-validator");
const express = require("express");
const router = express.Router();
const controller = require("../../controllers/group/group-controller");
const { validate, handleValidationResult } = require("../../../middleware/routes-validation");
const checkPermission = require("../../../utility/check-permission");
const enums = require('../../../contants/enum')
const {getUsersByGroup} = require('../../controllers/group/getUsersByGroup')
const {getUnassignedUserByGroup} = require('../../controllers/group/getUnassignedUserByGroup')
const {enrolToGroup} = require('../../controllers/group/enrolToGroup')
const {deleteGroup} = require('../../controllers/group/delete-group-controller')


router.get("/list/:organizationId?", checkPermission(enums.ModuleNames.Group_Management, [enums.Access_Types.RWD_O, enums.Access_Types.RW_ALL]), 
controller.retrieveAllGroups);
router.get("/create", checkPermission(enums.ModuleNames.Group_Management, [enums.Access_Types.RWD_O, enums.Access_Types.RW_ALL]), controller.create);

router.post("/enrollToGroup/:groupId/:hasRequestedToUnenroll?", enrolToGroup);

router.post("/create", validate("createGroup"), handleValidationResult, 
checkPermission(enums.ModuleNames.Group_Management, [enums.Access_Types.RWD_O, enums.Access_Types.RW_ALL]), controller.create);


router.get("/getUsersByGroup/:groupId",
    checkPermission(enums.ModuleNames.Group_Management, [enums.Access_Types.RWD_O, enums.Access_Types.RW_ALL]), getUsersByGroup);
router.get("/getUnassignedUser/:groupId", checkPermission(enums.ModuleNames.Group_Management,
    [enums.Access_Types.RWD_O, enums.Access_Types.RW_ALL]), getUnassignedUserByGroup);

router.delete("/delete/:groupId", checkPermission(enums.ModuleNames.Group_Management, [enums.Access_Types.RWD_O]),
    deleteGroup);

module.exports = router;
