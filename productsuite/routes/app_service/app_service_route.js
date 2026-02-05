const express = require("express");
 
const router = express.Router();
const Controller = require('../../controllers/application_service/appServiceController');
const validateAppServiceForm = require('../../validators/appServiceValidator');
const validationResultHandler = require('../../validators/validationResultHandler');
const checkPermission = require('../../../utility/check-permission');
const enums = require('../../../contants/enum');

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.get("/show-services/:subscriptionId?", asyncHandler(Controller.retrieveSubscribedServices));
router.get("/get-application-services/:application_id?", asyncHandler(Controller.retrieveApplicationServicesByApplication));
router.post("/calculate-service-cost", asyncHandler(Controller.calculateApplicationServiceCost));

router.get('/list', checkPermission(enums.ModuleNames.Application_Services, [enums.Access_Types.RWD_ALL, enums.Access_Types.R_ALL]), asyncHandler(Controller.retrieveAppServices));
router.get('/create', checkPermission(enums.ModuleNames.Application_Services, [enums.Access_Types.RWD_ALL]), asyncHandler(Controller.renderCreateForm));
router.post('/create', checkPermission(enums.ModuleNames.Application_Services, [enums.Access_Types.RWD_ALL]), validateAppServiceForm, validationResultHandler,asyncHandler(Controller.createAppService));
router.get('/remove/:id', checkPermission(enums.ModuleNames.Application_Services, [enums.Access_Types.RWD_ALL]), asyncHandler(Controller.deleteAppService));



module.exports = router;

