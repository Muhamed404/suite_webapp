// New helper for safe redirects with query params

const path = require('path');
const { logger } = require('../logger/logger');
const { redactEmail } = require('./redact');
const fs = require('fs').promises;
const enums = require('../contants/enum');
const fetch = require('node-fetch');

function extractAttachmentInfo(filePathRaw) {
  try {
    if (!filePathRaw) return { filename: '', attachmentExt: '', file_extension: '' };
    const raw = String(filePathRaw).trim();
    // remove query/hash
    const cleaned = raw.split('?')[0].split('#')[0];
    const isHttp = /^https?:\/\//i.test(cleaned);
    const isFileUrl = /^file:\/\//i.test(cleaned);

    // determine filename portion
    let filename;
    if (isHttp || isFileUrl) {
      // for file://, remove scheme first
      const withoutScheme = isFileUrl ? cleaned.replace(/^file:\/\//i, '') : cleaned;
      filename = withoutScheme.split('/').pop() || withoutScheme;
    } else {
      // local path: handle both forward and back slashes
      filename = cleaned.split(/[\\/]/).pop() || cleaned;
    }

    const attachmentExt = path.extname(filename) || ''; // includes leading dot e.g. ".pdf"
    const file_extension = attachmentExt.replace(/^\./, '').toLowerCase();

    return { filename, attachmentExt, file_extension, isHttp, isFileUrl, cleaned };
  } catch (err) {
    logger.warn('[extractAttachmentInfo] failed', { filePathRaw, err: err && err.stack || err });
    return { filename: '', attachmentExt: '', file_extension: '' };
  }
}

// New helper to fetch file contents from local path or HTTP(S) URL
const readFiles = async (phishing_page = null, landing_page = null) => {
  try {
    const [data1, data2] = await Promise.all([
      phishing_page ? fs.readFile(phishing_page, 'utf8') : Promise.resolve(null),
      landing_page ? fs.readFile(landing_page, 'utf8') : Promise.resolve(null)
    ]);

    return {
      phishing_page: phishing_page
        ? { path: phishing_page, content: data1 }
        : null,
      landing_page: landing_page
        ? { path: landing_page, content: data2 }
        : null
    };
  } catch (err) {
    logger.error('[readFiles] error reading files ' + err.stack);
    throw new Error('Error reading files');
  }
};

function hasAccess(req, module_name, allowedAccessTypes) {
  logger.info(`[HAS CREATE/UPDATE ACCESS] INCOMING PARAMS MODULE_NAME ${module_name} , ALLOWED KEYS ${allowedAccessTypes}`);
  const userPermissions = req.permissions;
  const hasAccess = userPermissions.some(
    (perm) =>
      perm.module.toLowerCase() === module_name.toLowerCase() &&
      allowedAccessTypes.some(type => type.toLowerCase() === perm.name.toLowerCase())
  );
  logger.info(`[HAS CREATE/UPDATE ACCESS] User:${redactEmail(req.user.email)} Access: ${hasAccess ? 'has Granted ✅' : 'has not Denied ❌'}`);
  if (!hasAccess) {
    logger.warn(`[HAS CREATE/UPDATE ACCESS] Access denied: Insufficient permission'}`);
    return false
  }
  return true;
}


function formatDate(dateStr) {
  const date = new Date(dateStr);
  const day = date.getDate();
  const month = date.toLocaleString('en-US', { month: 'short' });
  const year = date.getFullYear();
  const time = date.toLocaleString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  return `${day} ${month} ${year} ${time}`;
}


/**
 * Get badge color based on campaign status
 * @param {string} status - Campaign status
 * @returns {string} Tailwind color classes
 */
function getStatusBadgeColor(status) {
  status = enums.campaignStatus[status] || status;
  // console.log('Getting badge color for status:', status);

  const statusColors = {
    'Pending': 'bg-yellow-100 text-yellow-800', // Pending
    'Active': 'bg-green-100 text-green-800', // Active
    'Completed': 'bg-blue-100 text-blue-800', // Completed
    'Failed': 'bg-red-100 text-red-800',
    'Paused': 'bg-orange-100 text-orange-800'
  };
  return statusColors[status] || 'bg-gray-100 text-gray-800';
}

// Fetch HTML from a URL (for proxy endpoint)
async function fetchHtmlFromUrl(url) {
  if (!url || typeof url !== 'string') {
    throw new Error('Missing or invalid URL.');
  }
  if (!/^https?:\/\//i.test(url)) {
    throw new Error('Invalid URL format.');
  }
  const response = await fetch(url, { method: 'GET' });
  if (!response.ok) {
    throw new Error('Failed to fetch HTML.');
  }
  return await response.text();
}



/**
 * Validates password complexity requirements
 * @param {string} password - The password to validate
 * @param {Object} options - Optional configuration for password requirements
 * @param {number} options.minLength - Minimum password length (default: 8)
 * @param {boolean} options.requireUppercase - Require uppercase letter (default: true)
 * @param {boolean} options.requireLowercase - Require lowercase letter (default: true)
 * @param {boolean} options.requireNumber - Require number (default: true)
 * @param {boolean} options.requireSpecialChar - Require special character (default: true)
 * @param {string} options.specialChars - Allowed special characters (default: @$!%*?&)
 * @returns {Object} - Validation result with isValid, message, and details
 */
function validatePasswordComplexity(password, options = {}) {
  // Default options
  const config = {
    minLength: options.minLength || 8,
    requireUppercase: options.requireUppercase !== false,
    requireLowercase: options.requireLowercase !== false,
    requireNumber: options.requireNumber !== false,
    requireSpecialChar: options.requireSpecialChar !== false,
    specialChars: options.specialChars || '@$!%*?&'
  };

  // Initialize validation result
  const result = {
    isValid: true,
    message: '',
    details: {
      minLength: false,
      hasUppercase: false,
      hasLowercase: false,
      hasNumber: false,
      hasSpecialChar: false
    }
  };

  // If password is empty or null
  if (!password || typeof password !== 'string') {
    return {
      isValid: false,
      message: 'Password is required',
      details: result.details
    };
  }

  // Check minimum length
  result.details.minLength = password.length >= config.minLength;

  // Check for uppercase letter
  result.details.hasUppercase = /[A-Z]/.test(password);

  // Check for lowercase letter
  result.details.hasLowercase = /[a-z]/.test(password);

  // Check for number
  result.details.hasNumber = /\d/.test(password);

  // Check for special character
  const specialCharPattern = new RegExp(`[${config.specialChars.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}]`);
  result.details.hasSpecialChar = specialCharPattern.test(password);

  // Build validation result and error message
  const failedRequirements = [];

  if (!result.details.minLength) {
    failedRequirements.push(`at least ${config.minLength} characters`);
    result.isValid = false;
  }

  if (config.requireUppercase && !result.details.hasUppercase) {
    failedRequirements.push('an uppercase letter');
    result.isValid = false;
  }

  if (config.requireLowercase && !result.details.hasLowercase) {
    failedRequirements.push('a lowercase letter');
    result.isValid = false;
  }

  if (config.requireNumber && !result.details.hasNumber) {
    failedRequirements.push('a number');
    result.isValid = false;
  }

  if (config.requireSpecialChar && !result.details.hasSpecialChar) {
    failedRequirements.push(`a special character (${config.specialChars})`);
    result.isValid = false;
  }

  // Generate error message
  if (!result.isValid) {
    if (failedRequirements.length === 1) {
      result.message = `Password must include ${failedRequirements[0]}.`;
    } else if (failedRequirements.length === 2) {
      result.message = `Password must include ${failedRequirements.join(' and ')}.`;
    } else {
      const lastRequirement = failedRequirements.pop();
      result.message = `Password must include ${failedRequirements.join(', ')}, and ${lastRequirement}.`;
    }
  } else {
    result.message = 'Password meets all requirements.';
  }

  return result;
}

/**
 * Simple password strength validator (returns boolean)
 * @param {string} password - The password to validate
 * @returns {boolean} - True if password meets default requirements
 */
function isStrongPassword(password) {
  if (!password || typeof password !== 'string') {
    return false;
  }

  // Default strong password pattern:
  // At least 8 characters, one uppercase, one lowercase, one number, one special character
  const strongPasswordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return strongPasswordPattern.test(password);
}

/**
 * Get password strength score (0-5)
 * @param {string} password - The password to evaluate
 * @returns {Object} - Strength score and label
 */
function getPasswordStrength(password) {
  if (!password || typeof password !== 'string') {
    return { score: 0, label: 'None', color: 'gray' };
  }

  let score = 0;

  // Length criteria
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;

  // Complexity criteria
  if (/[a-z]/.test(password)) score++; // Has lowercase
  if (/[A-Z]/.test(password)) score++; // Has uppercase
  if (/\d/.test(password)) score++; // Has number
  if (/[@$!%*?&#^()_\-+={}[\]|\\:;"'<>,.~`]/.test(password)) score++; // Has special char

  // Cap at 5
  score = Math.min(score, 5);

  const strengthMap = {
    0: { label: 'None', color: 'gray' },
    1: { label: 'Very Weak', color: 'red' },
    2: { label: 'Weak', color: 'orange' },
    3: { label: 'Fair', color: 'yellow' },
    4: { label: 'Strong', color: 'green' },
    5: { label: 'Very Strong', color: 'teal' }
  };

  return {
    score,
    ...strengthMap[score]
  };
}

function cleanEmail(email) {
  if (!email || typeof email !== 'string') return '';
  return email
    .normalize('NFKC')
    .replace(/[\u200B-\u200D\uFEFF\u2060\u00AD]/g, '')
    .replace(/[\u00A0\u202F\u2007]/g, '')
    .trim()
    .toLowerCase();
}


const PHISHING_FORM_SUBMIT_ACTION = '<%-phishing_url_submit%>';


function normalizePhishingFormActions(content) {
  if (!content) return content;
  return content.replace(
    /action\s*=\s*"<%-phishing_url_submit%[^"]*"/gi,
    `action="${PHISHING_FORM_SUBMIT_ACTION}"`
  );
}

function injectPhishingFormWebAction(content) {
  if (!content) return content;

  content = normalizePhishingFormActions(content);

  const hasForm = /<form[\s>]/i.test(content);

  if (!hasForm) {
    return `<form action="${PHISHING_FORM_SUBMIT_ACTION}" method="post">\n${content}\n</form>`;
  }

  return content.replace(/<form(\b[^>]*)>/gi, (match, attrs) => {
    const a = attrs || '';

    if (/phishing_url_submit/i.test(a)) {
      return match;
    }

    let cleaned = a
      .replace(/\s*action\s*=\s*"[^"]*"/gi, '')
      .replace(/\s*action\s*=\s*'[^']*'/gi, '');

    cleaned += ` action="${PHISHING_FORM_SUBMIT_ACTION}"`;

    if (/\bmethod\s*=/i.test(cleaned)) {
      cleaned = cleaned.replace(/\bmethod\s*=\s*"[^"]*"/gi, 'method="post"');
      cleaned = cleaned.replace(/\bmethod\s*=\s*'[^']*'/gi, "method='post'");
    } else {
      cleaned += ' method="post"';
    }

    return `<form${cleaned}>`;
  });
}

function interactionScript() {
  const script = `
  <script>
    (function() {

      const TRACK_URL = "<%- phishing_url %>";
  let interactionSent = false; // <-- ensures firing only once

  function sendInteraction(data) {
    if (interactionSent) return; // stop duplicates
    interactionSent = true;

    fetch(TRACK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        pageUrl: window.location.href,
        ...data
      })
    }).catch(err => console.error("Tracking Error:", err));
  }

  // Detect first typing on ANY input, textarea, or content-editable
  function handleTyping() {
    sendInteraction({
      eventType: "typing_start"
    });

    // Remove listeners after first trigger
    document.removeEventListener("keydown", handleTyping);
    document.removeEventListener("input", handleTyping);
  }

  // Detect first copy attempt
  function handleCopy() {
    sendInteraction({
      eventType: "copy_attempt"
    });

    document.removeEventListener("copy", handleCopy);
  }

  // Add listeners
  document.addEventListener("keydown", handleTyping);
  document.addEventListener("input", handleTyping);
  document.addEventListener("copy", handleCopy);
})();
  </script>
  `;

  logger.info("[Create System Template] interactionScript created");
  return script;
}

module.exports = {
  injectPhishingFormWebAction,
  normalizePhishingFormActions,
  formatDate,
  extractAttachmentInfo,
  readFiles,
  hasAccess,
  getStatusBadgeColor,
  fetchHtmlFromUrl,
  validatePasswordComplexity,
  isStrongPassword,
  getPasswordStrength,
  cleanEmail,
  interactionScript
};

