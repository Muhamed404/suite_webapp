// validationMiddleware.js

const { query, check, validationResult, body, param } = require("express-validator");

const validateUserData = [
  check("username").notEmpty().withMessage("Username is required"),
  check("email").isEmail().withMessage("Invalid email"),
];

// Custom validation function for 'yyyy-mm-dd' date format
const isValidDate = (value) => {
  // Check if the value matches the 'yyyy-mm-dd' format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("Invalid date format, should be yyyy-mm-dd");
  }

  // Check if it's a valid date
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    throw new Error("Invalid date");
  }

  return true;
};

const validate = (method) => {
  switch (method) {
    case "addSubScription": {
      return [
        body("ttlUsers").isInt().toInt(),
        body("licenseStDate").custom(isValidDate),
        body("selectedPackage").isInt().toInt(),
        body("selectedService").isInt().toInt(),
        body("organization").isInt().toInt(),
      ];
    }
    case "userRoleId": {
      return [
        param("userRoleId")
          .exists()
          .isInt()
          .withMessage("Must be a valid user"),
      ];
    }
    case "validateOrgId": {
      return [
        param("orgId")
          .optional() // Make orgId optional
          .isInt()
          .withMessage("Organization must be valid")
      ];
    }
    case "validateCreateOrganization": {
      return [
        body("name")
          .notEmpty()
          .isString()
          .withMessage("Organization Name is required"),
        body("address")
          .notEmpty()
          .isString()
          .withMessage("Organization Address is required"),
        body("country").notEmpty().isInt().withMessage("Country is required"),
        body("state").notEmpty().isInt().withMessage("State is required"),
        body("city").notEmpty().isInt().withMessage("city is required"),
        body("email").isEmail().withMessage("email is required"),
        body("firstName")
          .notEmpty()
          .isString()
          .withMessage("Admin First Name is required"),
        body("lastName")
          .notEmpty()
          .isString()
          .withMessage("Admin Last Name is required"),
      ];
    }
    case "createDepartment": {
      return [
        body("name")
          .notEmpty()

          .isString()
          .withMessage("Name of Department is require"),
        body("description")
          .notEmpty()

          .isString()
          .withMessage("Description of Department is require"),
      ];
    }
    case "createGroup": {
      return [
        body("name")
          .notEmpty()

          .isString()
          .withMessage("Name of Group is required"),
      ];
    }
    case "validateInvoiceReport": {
      return [
        param("organizationId")
          .exists()
          .isInt()
          .withMessage("Must be a valid Organization"),
        param("invoiceId")
          .exists()
          .isInt()
          .withMessage("Must be a valid Invoice"),
      ];
    }
    case "changePassword": {
      return [
        body("current_password")
          .notEmpty()
          .withMessage("Current password is required")
          .isLength({ min: 6 })
          .withMessage("New password must be at least 6 characters long"),
        body("new_password")
          .notEmpty()
          .withMessage("New password is required")
          .isLength({ min: 6 })
          .withMessage("New password must be at least 6 characters long"),
        body("confirm_password")
          .notEmpty()
          .withMessage("Confirm password is required")
          .custom((value, { req }) => {
            if (value !== req.body.new_password) {
              throw new Error("Passwords do not match");
            }
            return true;
          }),
      ];
    }
    case "createCSCategories": {
      return [
        //param("orgId").notEmpty().isInt().withMessage("Invalid Organization"),
        body("name")
          .notEmpty()
          .withMessage("Name is required")
          .isLength({ min: 3 })
          .withMessage("Name must be at least 3 characters long"),
        body("code")
          .notEmpty()
          .withMessage("Code is required")
          .isLength({ min: 3 })
          .withMessage("Code must be at least 3 characters long"),
        body("description").notEmpty().withMessage("Description is required"),
      ];
    }
    case "deleteTemplate": {
      return [
        // param("orgId").notEmpty().isInt().withMessage("Invalid Organization"),
        param("templateId").notEmpty().isInt().withMessage("Invalid Template"),
      ];
    }
    case "copyTemplate": {
      return [
        // param("orgId").notEmpty().isInt().withMessage("Invalid Organization"),
        param("templateId").notEmpty().isInt().withMessage("Invalid Template"),

      ];
    }
    case "disableDepartment": {
      return [
        //param("orgId").notEmpty().isInt().withMessage("Invalid Organization"),
        body("id")
          .notEmpty()
          .withMessage("Invalid Department Id Passed"),
        body("name")
          .notEmpty()
          .withMessage("Invalid Department Name."),
      ];
    }
    case "renameDepartment": {
      return [
        //param("orgId").notEmpty().isInt().withMessage("Invalid Organization"),
        body("id")
          .notEmpty()
          .withMessage("Invalid Department Id Passed"),
        body("name")
          .notEmpty()
          .withMessage("Invalid Department Name."),
      ];
    }
    case "validateUpdateInvoice": {
      return [
        param("subscriptionId")
          .exists()
          .isInt()
          .withMessage("Must be a valid Subscription"),
        param("orderId")
          .exists()
          .isInt()
          .withMessage("Must be a valid Invoice"),
      ];
    }
    case "createSMTP": {
      return [
        param("orgId").notEmpty().isInt().withMessage("Invalid Organization"),
      ];
    }
    case "validatSMTP": {
      return [
        query("orgId")
          .notEmpty()
          .withMessage("Organization is required")
          .isInt()
          .withMessage("Organization must be an integer"),
      ];
    }
    case "tvbs-validation": {
      return [
        query("invitee")
          .notEmpty()
          .withMessage("Identifier is required")
          .isInt()
          .withMessage("Identifier must be an integer"),
        query("campaign")
          .notEmpty()
          .withMessage("Identifier is required")
          .isString()
          .withMessage("Identifier must be an Campaign"),
      ];
    }
  }
};

const handleValidationResult = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    //return res.status(400).json({ errors: errors.array() });
    logger.error(
      `Validation failed \n ${JSON.stringify(
        errors.array().map((err) => err.msg)
      )}`
    );
    req.flash("alertType", "error");
    req.flash("message", req.__("generic_label.form_validation_error"));

 
    return res.redirect(
      `/home`
    );
  }
  next(); // Continue to the next middleware if validation passes
};

module.exports = { validate, handleValidationResult };
