const express = require("express");
const router = express.Router();
const multerMiddleware = require("../../../middleware/multer-middleware");
const config = require("../../../config/env.config");
const enums = require('../../../contants/enum')
const checkPermission = require("../../../utility/check-permission");
const { logger } = require("../../../logger/logger");
const FormData = require("form-data");
const fs = require("fs");
const mime = require('mime-types');
const getApiClient = require('../../../utility/api-client')
const backend_api_urls = require('../../../config/backend_api_urls');
const frontend_api_urls = require('../../../config/frontend_api_urls');
const { redactLogData } = require("../../utility/redact");

router.post(
  "/upload",
  checkPermission(enums.ModuleNames.User_Management, [enums.Access_Types.RWD_O]),
  (req, res, next) => {
    logger.info('[File Upload]: POST received for file upload');

    // session/user guard
    if (!req.session || !req.user) {
      logger.warn('[File Upload]: No active session - redirecting to login');
      return res.redirect('/phm/login');
    }

    multerMiddleware("csvFile", null)(req, res, async (err) => {
      logger.info('[File Upload]: After multer parser');
      if (err) {
        logger.error('[File Upload]: Multer error', err);
        const message = encodeURIComponent(err.message || 'File upload error');
        return res.redirect(`/phm/?message=${message}&alertType=error`);
      }

      // basic validation and logging
      try {
        logger.info('[File Upload]: Incoming body: ' + JSON.stringify(redactLogData(req.body || {})));
        const file = req.file;
        if (!file) {
          logger.warn('[File Upload]: No file in request');
          return res.redirect(`/phm/?message=${encodeURIComponent('No file uploaded')}&alertType=error`);
        }

        logger.info(`[File Upload]: Received file: name=${file.originalname}, size=${file.size}, path=${file.path}, mimetype=${file.mimetype}`);

        // validate file type (allow common CSV types)
        const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'text/plain'];
        if (!allowedTypes.includes(file.mimetype)) {
          logger.warn(`[File Upload]: Invalid file type: ${file.mimetype}`);
          // cleanup temp file
          try { fs.unlinkSync(file.path); } catch (e) { logger.debug('[File Upload]: cleanup error', e); }
          return res.redirect(`/phm/?message=${encodeURIComponent('Invalid file type. Please upload a CSV file.')}&alertType=error`);
        }

        // validate size (example: limit 10 MB)
        const MAX_BYTES = 10 * 1024 * 1024;
        if (file.size > MAX_BYTES) {
          logger.warn(`[File Upload]: File too large: ${file.size} bytes`);
          try { fs.unlinkSync(file.path); } catch (e) { logger.debug('[File Upload]: cleanup error', e); }
          return res.redirect(`/phm/?message=${encodeURIComponent('File too large. Max 10MB allowed.')}&alertType=error`);
        }

        const departmentId = req.body?.hiddenFieldValue || 0;
        logger.info(`[File Upload]: departmentId: ${departmentId}`);
        const organization = req.params?.organizationId || req.user.organization_id;
        logger.info(`[File Upload]: organization id: ${organization}`);

        let url = "";
        let redirectUrl = frontend_api_urls.PRODUCT_SUITE.User_Management.SUITE_USERS || '/phm';
        const apiClient = getApiClient(req);
        const actionType = req.body?.actionType || 'user';

        if (actionType === "departmentUser") {
          logger.info(`[File Upload]: actionType=${actionType}`);
          url = `/department/uploadUsers/${organization}/${departmentId}`;
          redirectUrl = `/department/list/${organization}`;
        } else if (actionType === "group") {
          logger.info(`[File Upload]: actionType=${actionType}`);
          const groupId = req.body?.group || null;
          url = `/group/uploadUsers/${organization}/${groupId}`;
          redirectUrl = `/group/list/${organization}`;
        } else if (actionType === "organizationUser") {
          logger.info(`[File Upload]: actionType=${actionType}`);
          url = `/user/uploadUsers/${organization}`;
          redirectUrl = frontend_api_urls.PRODUCT_SUITE.User_Management.SUITE_USERS || '/phm/users';
        } else {
          logger.warn(`[File Upload]: Unknown actionType=${actionType}, defaulting to organizationUser`);
          url = `/user/uploadUsers/${organization}`;
          redirectUrl = frontend_api_urls.PRODUCT_SUITE.User_Management.SUITE_USERS || '/phm/users';
        }

        // prepare form-data and send
        const formData = new FormData();
        const fileStream = fs.createReadStream(file.path);
        formData.append("csvFile", fileStream, { filename: file.originalname, contentType: file.mimetype });

        logger.info(`[File Upload]: Sending file to backend url=${url}`);
        try {
          await apiClient.post(url, formData, {
            headers: { ...formData.getHeaders() },
            maxContentLength: Infinity,
            maxBodyLength: Infinity
          });
          logger.info('[File Upload]: File forwarded to backend successfully');
          // cleanup temp file
          try { fs.unlinkSync(file.path); } catch (e) { logger.debug('[File Upload]: cleanup error', e); }
          return res.redirect(`${redirectUrl}?message=${encodeURIComponent('File uploading is in process.')}&alertType=info`);
        } catch (apiErr) {
          logger.error('[File Upload]: Error posting to backend', apiErr && apiErr.message);
          logger.debug(apiErr);
          try { fs.unlinkSync(file.path); } catch (e) { logger.debug('[File Upload]: cleanup error', e); }
          // still inform user that processing is in progress or that error happened
          const msg = apiErr?.response?.data?.message || 'File upload failed. Contact administrator.';
          return res.redirect(`${redirectUrl}?message=${encodeURIComponent(msg)}&alertType=error`);
        }
      } catch (error) {
        logger.error('[File Upload]: Unexpected error', error && error.message);
        logger.debug(error && error.stack);
        // attempt to cleanup if multer put a file
        try { if (req.file && req.file.path) fs.unlinkSync(req.file.path); } catch (e) { logger.debug('[File Upload]: cleanup error', e); }
        return res.redirect(`/phm/index?message=${encodeURIComponent('Error in uploading. Contact Administrator')}&alertType=error`);
      }
    });
});


// --- Posters Upload: Handles file and category from form ---
router.post("/filePostersUpload", (req, res, next) => {
  multerMiddleware("postersFile")(req, res, async (err) => {
    logger.info(`[File Posters Upload]: Inside postersFile File upload`);

    if (err) {
      logger.error('[File Posters Upload]: Error in file poster upload: ' + err);
      const message = err.message || "Unknown error during file upload";
      return res.redirect(`/phm/?message=${encodeURIComponent(message)}&alertType=error`);
    }

    try {
      // Retrieve selected category from form
      const code = req.body.category; // <-- This is the selected category code
      const fileName = req.multerFileName ? req.multerFileName.toLowerCase() : null;
      const DISK_STORAGE_PATH = config.SECURE_MAGNUS_WORKSPACE + config.POSTERS_LIBRARY_FOLDER;

      logger.info(`[File Posters Upload]: After multer validation, file name: ${fileName}`);
      logger.info(`[File Posters Upload]: Request in filePostersUpload, code: ${code}`);
      logger.info(`[File Posters Upload]: Path: ${DISK_STORAGE_PATH}, code: ${code}, File name: ${fileName}`);

      if (!fileName) {
        logger.error('[File Posters Upload]: No file name found after multer.');
        return res.redirect(`/cybersecurity/categories/list?message=No file uploaded.&alertType=error`);
      }

      const payload = {
        code: code,
        name: fileName,
        file_path: DISK_STORAGE_PATH
      };

      const apiClient = getApiClient(req);
      const postUrl = backend_api_urls.PRODUCT_SUITE.CYBERSECURITY.FILE_POSTERS_UPLOAD;
      logger.info(`[File Posters Upload]: Posting to ${postUrl} with payload: \n` + JSON.stringify(redactLogData(payload), null, 2));
      const redirectUrl = `/cybersecurity/categories/list`;

      try {
        const response = await apiClient.post(postUrl, payload);
        const { message, alertType } = response.data;
        return res.redirect(`${redirectUrl}?message=${encodeURIComponent(message)}&alertType=${encodeURIComponent(alertType)}`);
      } catch (apiError) {
        logger.error(`[File Posters Upload]: API error: ${apiError.message}`);
        logger.error(apiError);
        logger.error(apiError.stack);
        return res.redirect(`${redirectUrl}?message=Contact to Administrator&alertType=error`);
      }
    } catch (error) {
      logger.error('[File Posters Upload]: Exception in postersFile catch');
      logger.error("Error sending file to another server:", error);
      const errMessage = "Error in Uploading, Contact to Administrator";
      return res.redirect(`/phm/index?message=${encodeURIComponent(errMessage)}&alertType=error`);
    }
  });
});




module.exports = router;
