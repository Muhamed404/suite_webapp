const backend_api_urls = require("../../../config/backend_api_urls");
const render_ejs_urls  = require("../../../config/render_ejs_urls");
const { logger }       = require("../../../logger/logger");
const getApiClient     = require("../../../utility/api-client");
const enums            = require("../../../contants/enum");

const ALLOWED_STATUSES = ['PENDING', 'PROCESSING', 'SENT', 'REJECTED', 'FAILED'];
const MAG_ADMIN_ROLES  = [enums.userType.MagSuperAdmin, enums.userType.MagSubAdmin];

exports.listNotificationMails = async (req, res) => {
  logger.info(`Controller - [NotificationMail]: Incoming request params=${JSON.stringify(req.params)} query=${JSON.stringify(req.query)}`);

  try {
    const userRole   = req.user?.role?.id;
    const isMagAdmin = MAG_ADMIN_ROLES.includes(userRole);

    // MagSuperAdmin/MagSubAdmin → pass 0 so backend returns ALL orgs (0 || null = null in route handler)
    const organizationId = isMagAdmin ? 0 : (req.user.organization_id !== null ? Number(req.user.organization_id) : 0);

    logger.info(`Controller - [NotificationMail]: role=${userRole}, isMagAdmin=${isMagAdmin}, orgId=${organizationId}`);
    const page           = Number(req.query.page)     || 1;
    const pageSize       = Number(req.query.pageSize)  || 20;
    const status         = ALLOWED_STATUSES.includes(req.query.status) ? req.query.status : '';
    const notificationType = req.query.notification_type || '';

    const url = backend_api_urls.PRODUCT_SUITE.Notification_Mail.LIST_BY_ORGANIZATION(organizationId);

    logger.info(`Controller - [NotificationMail]: Calling backend API: ${url}`);

    const response = await getApiClient(req).get(url, {
      params: { page, limit: pageSize, status: status || undefined, notification_type: notificationType || undefined },
    });

    if (!response?.data?.success) {
      logger.error(`Controller - [NotificationMail]: Backend failure: ${JSON.stringify(response?.data)}`);
      req.flash('alertType', 'error');
      req.flash('message', response?.data?.message || 'Failed to retrieve notification mails');
      return res.redirect('/home');
    }

    const { data: mails, totalRecords, totalPages, currentPage } = response.data;

    return res.render(render_ejs_urls.ProductSuiteManagement.Notification_Mail.LIST, {
      enableSuiteManagementLeftMenu: true,
      mails,
      organizationId,
      filters: { status, notificationType },
      pagination: {
        currentPage,
        pageSize,
        totalCount:      totalRecords,
        totalPages,
        hasNextPage:     currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
        nextPage:        currentPage + 1,
        previousPage:    currentPage - 1,
      },
    });
  } catch (error) {
    logger.error(`Controller - [NotificationMail]: ${error.message}`);
    logger.error(error.stack);
    req.flash('alertType', 'error');
    req.flash('message', 'Failed to retrieve notification mails');
    return res.redirect('/home');
  }
};
