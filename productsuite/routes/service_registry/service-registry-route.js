const express = require("express");
const router = express.Router();
const { renderForm, submitForm } = require('../../controllers/service_registry/create')
const { retrieveServiceList } = require('../../controllers/service_registry/list')
const { submitUpdateForm, renderUpdateForm } = require('../../controllers/service_registry/update');
const { deleteService } = require('../../controllers/service_registry/delete');
const checkPermission = require("../../../utility/check-permission");
const enums = require('../../../contants/enum')


router.get("/create", checkPermission(enums.ModuleNames.Service_Registry, [enums.Access_Types.RWD_ALL]), renderForm);
router.post("/create", checkPermission(enums.ModuleNames.Service_Registry, [enums.Access_Types.RWD_ALL]), submitForm);
router.post("/update/:service_id/r/:registry_id", checkPermission(enums.ModuleNames.Service_Registry, [enums.Access_Types.RWD_ALL]), submitUpdateForm);
router.get("/update/:service_id/r/:registry_id", checkPermission(enums.ModuleNames.Service_Registry, [enums.Access_Types.RWD_ALL]), renderUpdateForm);
router.get("/", checkPermission(enums.ModuleNames.Service_Registry, [enums.Access_Types.RWD_ALL]), retrieveServiceList);

// Delete route
router.post("/delete/r/:registry_id/s/:service_id", checkPermission(enums.ModuleNames.Service_Registry, [enums.Access_Types.RWD_ALL]), deleteService);

module.exports = router;
