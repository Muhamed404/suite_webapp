const controller = require("../../controllers/subscription-controller");
const express = require("express");
const { body, param, validationResult, query } = require("express-validator");
const { validate, handleValidationResult } = require("../../../middleware/routes-validation");

const router = express.Router();


router.get(
  "/create/:orgId",
  validate("validateOrgId"),
  handleValidationResult,
  controller.createSubscription
);
router.post(
  "/create/:orgId",
  // validate("validateOrgId"),
  // validate("addSubScription"),
  // handleValidationResult,
  controller.createSubscription
);

// const validateParams = [
//   query("subId").notEmpty().withMessage("Subscription is required"),
//   query("packageId").notEmpty().withMessage("package is required"),
// ];

// router.get("/isExist", validateParams, async (req, res) => {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     return res.status(400).json({ errors: errors.array() });
//   }
//   controller.findSubscriptionByService(req, res);
// });

router.get('/findAll',controller.findAll);

module.exports = router;
