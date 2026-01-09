// New helper for safe redirects with query params

const path = require('path');
const { logger } = require('../logger/logger');
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
  logger.info(`[HAS CREATE/UPDATE ACCESS] User:${req.user.email} Access: ${hasAccess ? 'has Granted ✅' : 'has not Denied ❌'}`);
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

// append FileFetcher to exports
module.exports = { formatDate, extractAttachmentInfo, readFiles, hasAccess,getStatusBadgeColor, fetchHtmlFromUrl };

