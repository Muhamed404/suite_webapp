const backend_api_urls = require("../../../config/backend_api_urls");
const render_ejs_urls = require("../../../config/render_ejs_urls");
const { logger } = require("../../../logger/logger");
const getApiClient = require("../../../utility/api-client");

exports.listNotificationTemplates = async (req, res) => {
  logger.info(`Controller - Notification Templates: Incoming request with params: ${JSON.stringify(req.params)}`);

  try {
    const organizationId = req.user.organization_id !== null
      ? Number(req.user.organization_id)
      : 0;

    // if (!organizationId) {
    //   logger.warn("Controller - Notification Templates: Missing organization ID");
    //   req.flash("alertType", "error");
    //   req.flash("message", "Invalid organization");
    //   return res.redirect("/home");
    // }

    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;

    const apiClient = getApiClient(req);
    const url = backend_api_urls.PRODUCT_SUITE.Notification_Template.LIST_BY_ORGANIZATION(organizationId);

    logger.info(`Controller - Notification Templates: Calling backend API: ${url}`);
    const response = await apiClient.get(url, { params: { page, pageSize } });

    if (!response?.data || !response.data.success) {
      logger.error(`Controller - Notification Templates: Backend returned failure: ${JSON.stringify(response?.data)}`);
      req.flash("alertType", "error");
      req.flash("message", response?.data?.message || "Failed to retrieve notification templates");
      return res.redirect("/home");
    }

    const { data: templates, totalRecords, totalPages, currentPage } = response.data;

    return res.render(render_ejs_urls.ProductSuiteManagement.Notification_Template.LIST, {
      enableSuiteManagementLeftMenu: true,
      templates,
      organizationId,
      pagination: {
        currentPage,
        pageSize,
        totalCount: totalRecords,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
        nextPage: currentPage + 1,
        previousPage: currentPage - 1,
      },
    });
  } catch (error) {
    logger.error(`Controller - Notification Templates: ${error.message}`);
    logger.error(`Controller - Notification Templates: ${error.stack}`);
    req.flash("alertType", "error");
    req.flash("message", "Failed to retrieve notification templates");
    return res.redirect("/home");
  }
};
