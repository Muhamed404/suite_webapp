const { validationResult } = require('express-validator');
const { logger } = require('../../logger/logger');

module.exports = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  const mapped = errors.array(); // [{ msg, param, location, ... }]

  // log the validation error with request context
  try {
    // add prominent ERROR marker (emoji) for easy spotting in logs
    logger.error(`❌ [Validation] Failed on ${req.originalUrl} - ${req.method} - IP:${req.ip} - errors: ${JSON.stringify(mapped)}`);
    logger.debug(`[Validation] Request body: ${JSON.stringify(req.body)}`);
  } catch (logErr) {
    // fallback to console if logger fails
    logger.error('❌ Validation logging error: ' + logErr);
    logger.error('❌ Validation errors: ' + JSON.stringify(mapped));
  }

  // error icon URL to show prominently in rendered page or return with JSON
  // const errorIcon = '/images/error.png';

  // If AJAX request or client expects JSON
  if (req.xhr || (req.headers.accept || '').includes('application/json')) {
    return res.status(422).json({ errors: mapped });
  }

  // For server-rendered form: re-render create page with errors and previous input.
  // Adjust template path and extra data (applications, etc.) as needed.
  return res.status(422).redirect('/home');
};