const express = require("express");
const router = express.Router();

const controller = require("../../controllers/package-controller");
const checkPermission = require("../../../utility/check-permission");
const enums = require('../../../contants/enum');
const { getPackagesByApplication } = require("../../controllers/package/packages_by_application");
const { calculatePackageCost } = require('../../controllers/package/calculate_package_cost')
const createPackage = require('../../controllers/package/createPackage');

const { body } = require("express-validator");

const validatePackageForm = [
  body("name")
    .notEmpty().withMessage("Package name is required")
    .isLength({ max: 255 }).withMessage("Package name must be at most 255 characters"),
  body("description")
    .notEmpty().withMessage("Description is required")
    .isLength({ max: 255 }).withMessage("Description must be at most 255 characters"),
  body("package_type")
    .notEmpty().withMessage("Package type is required")
    .isIn(["On Premise", "On Cloud", "N/A"]).withMessage("Invalid package type"),
  body("application")
    .notEmpty().withMessage("Application is required")
    .isInt({ min: 1 }).withMessage("Application must be a valid ID"),
  body("per_license_cost")
    .optional()
    .isFloat({ min: 0 }).withMessage("Per license cost must be a positive number"),
  body("license_range_from")
    .optional()
    .isInt({ min: 0 }).withMessage("License range from must be a non-negative integer"),
  body("license_range_to")
    .optional()
    .isInt({ min: 0 }).withMessage("License range to must be a non-negative integer"),
  body("duration_days")
    .optional()
    .isInt({ min: 0 }).withMessage("Duration days must be a non-negative integer"),
];



router.get("/applications/:selectedPackage", getPackagesByApplication)

router.get("/retrieve-package-cost/:packageId?", calculatePackageCost);

router.get("/", checkPermission(enums.ModuleNames.Package, [enums.Access_Types.RWD_ALL]), createPackage.renderCreateForm);
router.post("/create", validatePackageForm, checkPermission(enums.ModuleNames.Package, [enums.Access_Types.RWD_ALL]), createPackage.submitPackageForm);

router.get("/list", checkPermission(enums.ModuleNames.Package, [enums.Access_Types.RWD_ALL]), controller.retrieveAll);

router.get("/remove/:id", checkPermission(enums.ModuleNames.Package, [enums.Access_Types.RWD_ALL]), controller.deleteById);


module.exports = router;
