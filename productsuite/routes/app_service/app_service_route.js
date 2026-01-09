const express = require("express");
 
const router = express.Router();
const Controller = require('../../controllers/application_service/appServiceController');
const validateAppServiceForm = require('../../validators/appServiceValidator');
const validationResultHandler = require('../../validators/validationResultHandler');

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.get("/show-services/:subscriptionId?", asyncHandler(Controller.retrieveSubscribedServices));
router.get("/get-application-services/:application_id?", asyncHandler(Controller.retrieveApplicationServicesByApplication));
router.post("/calculate-service-cost", asyncHandler(Controller.calculateApplicationServiceCost));

router.get('/list', asyncHandler(Controller.retrieveAppServices));
router.get('/create', asyncHandler(Controller.renderCreateForm));
router.post('/create', validateAppServiceForm, validationResultHandler,asyncHandler(Controller.createAppService));



module.exports = router;

