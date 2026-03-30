const backend_api_urls = require("../../../config/backend_api_urls");
const { logger } = require("../../../logger/logger");
const getApiClient = require("../../../utility/api-client");

exports.viewLogs = async (req, res) => {
  logger.info(`Controller - View Logs: Incoming request with Params: ${JSON.stringify(req.params)}`);
  try {
    if (req.method !== "GET") {
      req.flash('alertType', 'error');
      req.flash('message', 'Invalid request method');
      return res.redirect("/home");
    }

    if (!req.params.organizationId || req.params.organizationId === null || req.params.organizationId === undefined) {
      logger.warn('Organization ID is missing in parameters');
      req.flash('alertType', 'error');
      req.flash('message', 'Invalid request parameters');
      return res.redirect("/home");
    }

    // Determine organization and user IDs
    const organizationId = req.user.organization_id !== null ? Number(req.user.organization_id) : Number(req.params.organizationId);

    if (!organizationId) {
      logger.warn('Organization is undefined');
      req.flash('alertType', 'error');
      req.flash('message', 'Invalid user organization');
      return res.redirect("/home");
    }

    // Pagination
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;

    // Build report filter
    const reportFilter = {
      organization_id: organizationId,
      ...(req.user.organization_id !== null ? { user_id: req.user.id } : {})
    };

    // Build query params
    const queryParams = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      reportFilter: JSON.stringify(reportFilter)
    });


    const apiClient = getApiClient(req);
    const url = backend_api_urls.PRODUCT_SUITE.Audit_Log.VIEW_LOGS(queryParams);
    logger.info(`Controller - Audit Log: Backend API Caller: ${url}`);
    const response = await apiClient.get(url, { headers: { 'Accept': 'application/json' } });
    logger.info(`audit report ${JSON.stringify(response.data, null, 2)}`)
    if (!response?.data || !response.data.success) {
      req.flash('alertType', 'error');
      req.flash('message', response?.data?.message || 'Failed to fetch audit logs');
      return res.redirect("/home");
    }
    logger.info(`Controller - View Logs: Successfully fetched audit logs from backend`);
    const { data: report } = response.data;
    // logger.info(`Controller - View Logs: Backend Response: ${JSON.stringify(report, null, 2)}`);

    // Use pagination info from backend response
    const totalCount = response.data.totalRecords;
    const totalPages = response.data.totalPages || Math.ceil(totalCount / pageSize);
    const currentPage = response.data.page;
    // Render the audit logs view
    return res.render("pages/audit/view-logs", {
      enableSuiteManagementLeftMenu: true,
      report,
      organizationName: req.query?.On || '',
      organizationId,
      pagination: {
        currentPage: currentPage,
        pageSize: pageSize,
        totalCount: totalCount,
        totalPages: totalPages,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
        nextPage: currentPage + 1,
        previousPage: currentPage - 1
      },


    });

  } catch (error) {
    logger.error("[View Audit Report]: " + error.message);
    logger.error("[View Audit Report]: " + error.stack);
    req.flash('alertType', 'error');
    req.flash('message', 'Failed to fetch audit logs');
    return res.redirect("/home");
  }
};