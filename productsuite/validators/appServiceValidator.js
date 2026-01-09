const { body } = require("express-validator");

const validateAppServiceForm = [
  body("application")
    .notEmpty().withMessage("Application is required")
    .isInt({ min: 1 }).withMessage("Application must be a valid ID"),
  body("service_name")
    .notEmpty().withMessage("Service name is required")
    .isLength({ max: 255 }).withMessage("Service name must be at most 255 characters"),
  body("service_detail")
    .optional()
    .isLength({ max: 255 }).withMessage("Service detail must be at most 255 characters"),
  body("per_service_cost")
    .optional()
    .isInt({ min: 1 }).withMessage("Service cost must be a positive integer"),
];

module.exports = validateAppServiceForm;