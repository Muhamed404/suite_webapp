const { logger } = require("../../../logger/logger");
const enums = require("../../../contants/enum");
const getApiClient = require("../../../utility/api-client");
const render_ejs_urls = require("../../../config/render_ejs_urls");
const frontend_api_urls = require("../../../config/frontend_api_urls");
const backend_api_urls = require("../../../config/backend_api_urls");

exports.renderBulkImportJobs = async (req, res) => {
  logger.info("Controller - Render Bulk Import Jobs");
  try {
    const roleId = req.user.role.id;
    const isMag =
      roleId === enums.userType.MagSuperAdmin || roleId === enums.userType.MagSubAdmin;

    const paramOrg = req.params.organizationId;
    let organizationId =
      paramOrg !== undefined && paramOrg !== "" && paramOrg != null
        ? parseInt(paramOrg, 10)
        : parseInt(req.user.organization_id, 10);

    if (isMag && (Number.isNaN(organizationId) || organizationId <= 0)) {
      req.flash("message", req.__("user.bulkImportSelectOrganization"));
      req.flash("alertType", "error");
      return res.redirect("/organization/");
    }

    if (!isMag && (Number.isNaN(organizationId) || organizationId <= 0)) {
      req.flash("message", req.__("user.bulkImportInvalidOrganization"));
      req.flash("alertType", "error");
      return res.redirect(frontend_api_urls.PRODUCT_SUITE.Home.INDEX);
    }

    const apiClient = getApiClient(req);
    const listUrl = backend_api_urls.PRODUCT_SUITE.User_Management.BULK_IMPORT_LIST(organizationId);
    const response = await apiClient.get(listUrl, { params: { limit: 100, offset: 0 } });
    const payload = response.data?.object || { total: 0, jobs: [] };

    const highlightJobIdRaw = req.query.jobId;
    const highlightJobId =
      highlightJobIdRaw !== undefined && highlightJobIdRaw !== ""
        ? parseInt(highlightJobIdRaw, 10)
        : null;

    return res.render(render_ejs_urls.ProductSuiteManagement.User_Management.BULK_IMPORT_JOBS, {
      enableSuiteManagementLeftMenu: true,
      organizationId,
      jobs: payload.jobs || [],
      total: payload.total ?? 0,
      highlightJobId: Number.isNaN(highlightJobId) ? null : highlightJobId,
      locale: req.getLocale(),
    });
  } catch (error) {
    logger.error(`Error - Render Bulk Import Jobs: ${error.message}`);
    logger.error(error.stack);
    req.flash("message", req.__("user.bulkImportJobsLoadError"));
    req.flash("alertType", "error");
    return res.redirect(frontend_api_urls.PRODUCT_SUITE.Home.INDEX);
  }
};
