const express = require("express");
const router = express.Router();
const controller = require("../../../phishmagnus/controllers/department/department-controller");
const { validate, handleValidationResult } = require("../../../middleware/routes-validation");
const checkPermission = require("../../../utility/check-permission");
const enums = require('../../../contants/enum')
const { getUsersByDepartment } = require('../../../phishmagnus/controllers/user/getUsersByDepartment')
const { getUsersByUnAssignedDepartment } = require('../../../phishmagnus/controllers/user/getUsersByUnAssignedDepartment')
const { deleteDepartment } = require('../../../phishmagnus/controllers/department/delete-department-controller')


// Logging middleware for all department routes
router.use((req, res, next) => {
    logger.info(`[Department Route] ${req.method} ${req.originalUrl}`);
    next();
});


router.get("/getUsersByDepartment/:organizationId?/:departmentId",
    checkPermission(enums.ModuleNames.Department, [enums.Access_Types.RWD_O, enums.Access_Types.RW_ALL]), getUsersByDepartment);
router.get("/getUsersByUnAssignedDepartment/:organizationId?",
    checkPermission(enums.ModuleNames.Department,
    [enums.Access_Types.RWD_O, enums.Access_Types.RW_ALL]), getUsersByUnAssignedDepartment);


router.post("/enrollToDepartment/:organizationId?/:departmentId/:hasRequestedToUnenroll?", checkPermission(enums.ModuleNames.Department,
    [enums.Access_Types.RWD_O, enums.Access_Types.RW_ALL]), controller.enrolToDepartment);

router.get("/",
    checkPermission(enums.ModuleNames.Department, [enums.Access_Types.RWD_O, enums.Access_Types.RW_ALL]), controller.createDepartment);

router.get("/list/:organizationId?",
    checkPermission(enums.ModuleNames.Department, [enums.Access_Types.RWD_O, enums.Access_Types.RW_ALL]),
    controller.fetchDepartment);

router.post("/",
    checkPermission(enums.ModuleNames.Department, [enums.Access_Types.RWD_O, enums.Access_Types.RW_ALL]), validate("createDepartment"), handleValidationResult, controller.createDepartment);
router.post("/rename",
    checkPermission(enums.ModuleNames.Department, [enums.Access_Types.RWD_O, enums.Access_Types.RW_ALL]), validate("renameDepartment"), handleValidationResult, controller.renameDepartment);
router.post("/disable/:orgId",
    checkPermission(enums.ModuleNames.Department, [enums.Access_Types.RWD_O, enums.Access_Types.RW_ALL]), validate("disableDepartment"), handleValidationResult, controller.disableDepartment);
router.post("/save-department-users/:departmentId",
    checkPermission(enums.ModuleNames.Department, [enums.Access_Types.RWD_O, enums.Access_Types.RW_ALL]), controller.addUsersIntoDepartments);

router.delete("/delete/:departmentId", checkPermission(enums.ModuleNames.Department, [enums.Access_Types.RWD_O]),
    deleteDepartment);

module.exports = router;
