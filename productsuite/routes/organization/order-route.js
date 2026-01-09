const express = require("express");
const {
  body,
  param,
  validationResult,
  check,
  query,
} = require("express-validator");
const router = express.Router();

const controller = require("../../controllers/order-controller");
const { validate, handleValidationResult } = require("../../../middleware/routes-validation");

// Routes
const ordervalidation = [
  param("id").isInt().withMessage("Organization ID is required"),
];

// Define validation rules for query parameters
const validateQueryParameters = [
  query("orgId").isInt().withMessage("Please provide valid organization"),
  query("subId").isInt().withMessage("Please provide valid subscription"),
  query("packageId").isInt().withMessage("Please provide valid package"),
];
const validateSubscriptionOrder = [
  check("payment_description")
    .notEmpty()
    .withMessage("Payment description is required"),
  check("total_cost")
    .isFloat({ min: 0 })
    .withMessage("Total cost must be a positive number"),
  check("discount")
    .isFloat({ min: 0 })
    .withMessage("Discount must be a positive number"),
  check("payment_amount")
    .isFloat({ min: 0 })
    .withMessage("Payment amount must be a positive number"),
  check("res_address")
    .notEmpty()
    .withMessage("Residential address is required"),
  check("res_country_id")
    .isInt({ min: 1 })
    .withMessage("Valid country ID is required"),
  // Add more validation rules as needed
];

router.get(
  "/invoice/:organizationId/:subscriptionId/:orderId",
  controller.displayInvoice
);

router.get("/update/:subscriptionId", controller.updateInvoice);
router.post("/updateInvoice", controller.updateInvoice);

module.exports = router;
