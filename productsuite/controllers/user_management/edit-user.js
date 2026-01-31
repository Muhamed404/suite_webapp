const { logger } = require("../../../logger/logger");
const ICONSTANTS = require("../../../contants/ICONSTANTS");
const enums = require('../../../contants/enum')
const getApiClient = require('../../../utility/api-client');
const render_ejs_urls = require("../../../config/render_ejs_urls");
const frontend_api_urls = require("../../../config/frontend_api_urls");
const backend_api_urls = require("../../../config/backend_api_urls");
const { validatePasswordComplexity } = require("../../../utility/helperFunctions");

/**
 * Validates user ID from request parameters
 * @param {string} userId - The user ID to validate
 * @returns {Object} - Validation result with isValid and parsedId
 */
const validateUserId = (userId) => {
  const parsedId = parseInt(userId, 10);
  const isValid = userId && !isNaN(parsedId) && parsedId > 0;

  return {
    isValid,
    parsedId: isValid ? parsedId : null
  };
};

/**
 * Validates required fields in the payload
 * @param {Object} payload - Request body payload
 * @returns {Object} - Validation result with isValid and message
 */
const validateRequiredFields = (payload) => {
  const requiredFields = ['firstName', 'lastName', 'email'];
  const missingFields = requiredFields.filter(field => !payload[field]);

  if (missingFields.length > 0) {
    return {
      isValid: false,
      message: `Missing required fields: ${missingFields.join(', ')}`
    };
  }

  if (typeof payload.status === 'undefined') {
    return {
      isValid: false,
      message: 'Status is required'
    };
  }

  return { isValid: true };
};

/**
 * Validates password fields with conditional requirements and complexity
 * @param {string} newPassword - New password value
 * @param {string} confirmPassword - Confirm password value
 * @returns {Object} - Validation result with isValid, message, and shouldUpdatePassword
 */
const validatePasswordFields = (newPassword, confirmPassword) => {
  const trimmedNew = newPassword?.trim() || '';
  const trimmedConfirm = confirmPassword?.trim() || '';

  // Both empty - valid (no password change)
  if (!trimmedNew && !trimmedConfirm) {
    return {
      isValid: true,
      shouldUpdatePassword: false,
      password: null
    };
  }

  // New password empty, confirm filled
  if (!trimmedNew && trimmedConfirm) {
    return {
      isValid: false,
      message: 'New password is required when confirm password is provided',
      shouldUpdatePassword: false
    };
  }

  // Confirm password empty, new filled
  if (trimmedNew && !trimmedConfirm) {
    return {
      isValid: false,
      message: 'Confirm password is required when new password is provided',
      shouldUpdatePassword: false
    };
  }

  // Both filled - validate password complexity
  const complexityValidation = validatePasswordComplexity(trimmedNew);
  if (!complexityValidation.isValid) {
    return {
      isValid: false,
      message: complexityValidation.message,
      shouldUpdatePassword: false
    };
  }

  // Check if passwords match
  if (trimmedNew !== trimmedConfirm) {
    return {
      isValid: false,
      message: 'Passwords must match',
      shouldUpdatePassword: false
    };
  }

  // All validations passed
  return {
    isValid: true,
    shouldUpdatePassword: true,
    password: trimmedNew
  };
};

/**
 * Prepares payload for API request
 * @param {Object} payload - Original payload
 * @param {Object} passwordValidation - Password validation result
 * @returns {Object} - Cleaned payload ready for API
 */
const preparePayload = (payload, passwordValidation) => {
  const cleanedPayload = { ...payload };

  if (passwordValidation.shouldUpdatePassword) {
    cleanedPayload.password = passwordValidation.password;
  }

  // Remove temporary password fields
  delete cleanedPayload.newPassword;
  delete cleanedPayload.confirmPassword;

  return cleanedPayload;
};

/**
 * Determines the redirect URL based on user's organization
 * @param {Object} user - Current user object
 * @returns {string} - Redirect URL
 */
const getSuccessRedirectUrl = (user) => {
  return user.organization_id === null
    ? frontend_api_urls.PRODUCT_SUITE.User_Management.SECUREMAGNUS_USERS_LIST
    : frontend_api_urls.PRODUCT_SUITE.User_Management.SUITE_USERS;
};

/**
 * Main controller for editing user
 */
exports.editUser = async (req, res) => {
  logger.info(`Controller - [Edit User]: Incoming request to edit user with ID ${JSON.stringify(req.params, null, 2)}`);

  try {
    const userId = req.params?.userId || null;

    // Validate user ID
    const userIdValidation = validateUserId(userId);
    if (!userIdValidation.isValid) {
      logger.warn(`Controller - [Edit User]: Invalid user ID passed: ${userId}`);
      req.flash("message", "Invalid User ID. Please contact administrator.");
      req.flash("alertType", "error");
      return res.redirect(frontend_api_urls.PRODUCT_SUITE.User_Management.SUITE_USERS);
    }

    const payload = req.body || {};
    logger.info(`Controller - [Edit User]: Payload received for user ID ${userId}: ${JSON.stringify(payload, null, 2)}`);

    // Validate required fields
    const requiredFieldsValidation = validateRequiredFields(payload);
    if (!requiredFieldsValidation.isValid) {
      logger.warn(`Controller - [Edit User]: ${requiredFieldsValidation.message}`);
      req.flash("message", requiredFieldsValidation.message);
      req.flash("alertType", "error");
      return res.redirect(frontend_api_urls.PRODUCT_SUITE.User_Management.EDIT_USER(userId));
    }

    // Validate password fields
    const passwordValidation = validatePasswordFields(payload.newPassword, payload.confirmPassword);
    if (!passwordValidation.isValid) {
      logger.warn(`Controller - [Edit User]: Password validation failed - ${passwordValidation.message}`);
      req.flash("message", passwordValidation.message);
      req.flash("alertType", "error");
      return res.redirect(frontend_api_urls.PRODUCT_SUITE.User_Management.EDIT_USER(userId));
    }

    // Log password update status
    if (passwordValidation.shouldUpdatePassword) {
      logger.info(`Controller - [Edit User]: Password validation passed, updating password for user ID ${userId}`);
    } else {
      logger.info(`Controller - [Edit User]: No password change requested for user ID ${userId}`);
    }

    // Prepare final payload
    const finalPayload = preparePayload(payload, passwordValidation);

    // Make API request
    const apiClient = getApiClient(req);
    const userResponse = await apiClient.put(
      backend_api_urls.PRODUCT_SUITE.User_Management.SAVE_EDIT_USER(userId),
      finalPayload
    );
    logger.info(`Controller - [Edit User]: API Response: ${JSON.stringify(userResponse.data, null, 2)}`);

    // Handle API response
    if (!userResponse.data.success) {
      req.flash("message", userResponse.data.message || "Error in saving user.");
      req.flash("alertType", "error");
      return res.redirect(frontend_api_urls.PRODUCT_SUITE.User_Management.EDIT_USER(userId));
    }

    // Success - redirect based on user organization
    req.flash("message", req.__('user_management.edit_user.user_updated_successfully'));
    req.flash("alertType", "success");

    const redirectUrl = getSuccessRedirectUrl(req.user);
    return res.redirect(redirectUrl);

  } catch (error) {
    logger.error(`Error Controller - [Edit User]: ${error.message || error}`);
    logger.error(`Error Controller - [Edit User]: ${error.stack}`);
    req.flash("message", error?.response?.data?.message || 'Error in saving user.');
    req.flash("alertType", "error");
    return res.redirect(frontend_api_urls.PRODUCT_SUITE.User_Management.SUITE_USERS);
  }
};
