const { logger } = require("../../../logger/logger");
const { getFilteredRolesByOrganizationLevel} = require("../../../commons/commons");
const { hasAccess } = require("../../../utility/helperFunctions");
const ICONSTANTS = require("../../../contants/ICONSTANTS");
const enums = require('../../../contants/enum')
const getApiClient = require('../../../utility/api-client');
const render_ejs_urls = require("../../../config/render_ejs_urls");
const frontend_api_urls = require("../../../config/frontend_api_urls");
const multerMiddleware = require("../../../middleware/multer-middleware");
const FormData = require("form-data");
const fs = require("fs");
const mime = require('mime-types');
const { redactEmail, redactLogData } = require("../../../utility/redact");



exports.renderBulkUserModule = async (req, res, next) => {
  logger.info(`[Render Bulk User Module] Entered Render Bulk User Module with method ${req.method}`);
  try {
    if (req.method === "GET") {
      let userSession = req.user;

      let organizationCode = userSession.organization_id;
      if (organizationCode === undefined || organizationCode === null || isNaN(organizationCode)) {
        logger.warn(`[Render Bulk User Module] Invalid organization ID`);
        req.flash("message", "Invalid Organization ID. Please contact administrator.");
        req.flash("alertType", "error");
        return res.redirect(frontend_api_urls.PRODUCT_SUITE.User_Management.SUITE_USERS);
      }

      if (req.user.role.id === enums.userType.MagSuperAdmin || req.user.role.id === enums.userType.MagSubAdmin) {
        logger.info(`[Render Bulk User Module] MAG Admin user trying to access create user page. Setting orgId to 0`);
        organizationCode = 0;
      } else {
        logger.info(`[Render Bulk User Module] Non MAG Admin user trying to access create user page. Setting orgId from session: ${organizationCode}`);
        organizationCode = userSession.organization_id;
      }


      const organizationRoles = await getFilteredRolesByOrganizationLevel(req, organizationCode);

      let respSubscription = null;
      let subscription = null;
      const apiClient = getApiClient(req);
      const hasCreatePermission = Boolean(false);
      const disableSubmitBtn = Boolean(false)
      if (organizationCode !== 0) {
        let subscriptionUrl = `/subscription/findAllByOrg/${organizationCode}`;
        respSubscription = await apiClient.get(subscriptionUrl);
        subscription = respSubscription.data.message;
        logger.info(`[Render Bulk User Module] Printing Subscription: ` + JSON.stringify(redactLogData(subscription)))
      }


      if (!hasAccess(req, enums.ModuleNames.User_Management, [enums.Access_Types.RWD_ALL, enums.Access_Types.RW_O, enums.Access_Types.RWD_O])) {
        logger.info(`[Render Bulk User Module] Enabling Create Button for user: ` + redactEmail(userSession.email))

        hasCreatePermission = Boolean(true)
      }
      logger.info(`[Render Bulk User Module] Applications: ${JSON.stringify(enums.Product_Selection, null, 2)}`)
      const renderData = {
        Applications: enums.Product_Selection,
        enableSuiteManagementLeftMenu: true,
        roles: organizationRoles,
        hasCreatePermission,
        userTypes: enums.userType,
        orgId: organizationCode,
        enumServices: enums.serviceTypes,
        disableSubmitBtn,
        organization: organizationCode
      };

      if (subscription !== null && subscription !== undefined && subscription !== false && subscription !== 0 && subscription !== '' && subscription !== NaN) {
        renderData.available_quota = subscription[0]?.available_quota || 0;
        renderData.disableSubmitBtn = renderData.available_quota === 0 ? Boolean(true) : Boolean(false)
      } else if (req.user.role.id === enums.userType.MagSuperAdmin || req.user.role.id === enums.userType.MagSubAdmin) {
        renderData.available_quota = 100000000;
      }
      res.render(render_ejs_urls.ProductSuiteManagement.User_Management.BULK_UPLOAD, renderData);
    }
  } catch (error) {
    logger.error(`Error in Render Bulk User Module: ${error}`);
    logger.error(error.stack)
    req.flash("message", "Some Issue. Contact Administrator");
    req.flash("alertType", "error");
    return res.redirect(frontend_api_urls.PHISHMAGNUS.Home.INDEX);
  }
};




exports.uploadBulkUsers = async (req, res, next) => {
  logger.info(`Controller - Upload Bulk Users: ${JSON.stringify(redactLogData(req.body), null, 2)}`);
  try {
    multerMiddleware("csvFile", null)(req, res, async (err) => {
      logger.info('Controller - Upload Bulk Users: After multer parser');
      if (err) {
        logger.error('Controller - Upload Bulk Users: Multer error', err);
        req.flash("message", err.message || 'File upload error');
        req.flash("alertType", "error");
        return res.redirect(frontend_api_urls.PRODUCT_SUITE.User_Management.SUITE_USERS);
      }

      try {
        logger.info('Controller - Upload Bulk Users: ' + JSON.stringify(redactLogData(req.body || {})));
        const file = req.file;
        if (!file) {
          logger.warn('Controller - Upload Bulk Users: No file in request');
          req.flash("message", 'No file uploaded');
          req.flash("alertType", "error");
          return res.redirect(frontend_api_urls.PRODUCT_SUITE.User_Management.SUITE_USERS);
        }

        logger.info(`Controller - Upload Bulk Users: Received file: name=${file.originalname}, size=${file.size}, path=${file.path}, mimetype=${file.mimetype}`);

        // Validate file type
        const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'text/plain'];
        if (!allowedTypes.includes(file.mimetype)) {
          logger.warn(`Controller - Upload Bulk Users: Invalid file type: ${file.mimetype}`);
          try { fs.unlinkSync(file.path); } catch (e) { logger.error('[File Upload]: cleanup error'+ e); }
          req.flash("message", 'Invalid file type. Please upload a CSV file.');
          req.flash("alertType", "error");
          return res.redirect(frontend_api_urls.PRODUCT_SUITE.User_Management.SUITE_USERS);
        }

        const organization = Number(req.user.organization_id);
        logger.info(`Controller - Upload Bulk Users: organization id: ${organization}`);

        const apiClient = getApiClient(req);
        const url = `/user/create/bulk/${organization}`;
        const selectedProductKey = req.body?.application || null;

        // Prepare form-data and send
        const formData = new FormData();
        const fileStream = fs.createReadStream(file.path);
        formData.append("csvFile", fileStream, { filename: file.originalname, contentType: file.mimetype });
        formData.append("selectedProductKey", selectedProductKey);

        logger.info(`[File Upload]: Sending file to backend url=${url}`);
        try {
          const response = await apiClient.post(url, formData, {
            headers: { ...formData.getHeaders() },
            maxContentLength: Infinity,
            maxBodyLength: Infinity
          });
          logger.info('[File Upload]: File forwarded to backend successfully');
          try { fs.unlinkSync(file.path); } catch (e) { logger.error('[File Upload]: cleanup error'+ e); }
          const data = response.data || {};
          const jobId = data.object && data.object.job_id;
          const orgFromJob = data.object && data.object.organization_id;
          if (data.alertType === 'success' && jobId != null) {
            const orgForJobs = orgFromJob != null && !Number.isNaN(Number(orgFromJob)) && Number(orgFromJob) > 0
              ? Number(orgFromJob)
              : organization;
            const jobsPath = frontend_api_urls.PRODUCT_SUITE.User_Management.BULK_IMPORT_JOBS(orgForJobs);
            req.flash("message", req.__("user.bulkImportQueuedShort"));
            req.flash("alertType", "success");
            return res.redirect(`${jobsPath}?jobId=${encodeURIComponent(String(jobId))}`);
          }
          req.flash("message", 'File uploading is in process.');
          req.flash("alertType", "success");
          return res.redirect(frontend_api_urls.PRODUCT_SUITE.User_Management.SUITE_USERS);
        } catch (apiErr) {
          logger.error('[File Upload]: Error posting to backend', apiErr && apiErr.message);
          logger.error(apiErr);
          try { fs.unlinkSync(file.path); } catch (e) { logger.error('[File Upload]: cleanup error'+ e); }
          req.flash("message", 'File upload failed. Contact administrator.');
          req.flash("alertType", "error");
          return res.redirect(frontend_api_urls.PRODUCT_SUITE.User_Management.SUITE_USERS);
        }
      } catch (error) {
        logger.error('[File Upload]: Unexpected error', error && error.message);
        logger.error(error && error.stack);
        try { if (req.file && req.file.path) fs.unlinkSync(req.file.path); } catch (e) { logger.error('[File Upload]: cleanup error', e); }
        req.flash("message", 'File upload failed. Contact administrator.');
        req.flash("alertType", "error");
        return res.redirect(frontend_api_urls.PRODUCT_SUITE.User_Management.SUITE_USERS);
      }
    });
  } catch (error) {
    logger.error(`Error - Upload Bulk Users: ${error}`);
    logger.error('Error - Upload Bulk Users:' + error.stack);
    req.flash("message", 'File upload failed. Contact administrator.');
    req.flash("alertType", "error");
    return res.redirect(frontend_api_urls.PRODUCT_SUITE.User_Management.SUITE_USERS);
  }
};