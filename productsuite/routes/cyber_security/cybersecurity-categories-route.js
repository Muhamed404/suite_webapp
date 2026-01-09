const express = require("express");
const router = express.Router();
const controller = require("../../controllers/cyber_security/cybersecurity-categories-controller");
const { validate, handleValidationResult } = require("../../../middleware/routes-validation");

router.get("/categories/", controller.create);
router.post("/categories/", validate("createCSCategories"), handleValidationResult ,controller.create);

 

router.get("/categories/list", controller.findAllByOrganization);
router.get("/categories/disableCategory/:catId", controller.disableCategory);


module.exports = router;
