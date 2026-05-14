const backend_api_urls = require("../../../config/backend_api_urls");
const render_ejs_urls  = require("../../../config/render_ejs_urls");
const { logger }       = require("../../../logger/logger");
const getApiClient     = require("../../../utility/api-client");
const { redactLogData } = require("../../../utility/redact");

const ALLOWED_STATUSES = ['PENDING', 'PROCESSING', 'SENT', 'REJECTED', 'FAILED'];

exports.listMFAMails = async (req, res) => {
  logger.info(`Controller - [MFAMail]: query=${JSON.stringify(redactLogData(req.query))}`);

  try {
    const page     = Number(req.query.page)     || 1;
    const pageSize = Number(req.query.pageSize)  || 20;
    const status   = ALLOWED_STATUSES.includes(req.query.status) ? req.query.status : '';

    const url = backend_api_urls.PRODUCT_SUITE.MFA_Mail.LIST;

    logger.info(`Controller - [MFAMail]: Calling backend API: ${redactLogData(url)}`);

    const response = await getApiClient(req).get(url, {
      params: { page, limit: pageSize, status: status || undefined },
    });

    if (!response?.data?.success) {
      logger.error(`Controller - [MFAMail]: Backend failure: ${JSON.stringify(redactLogData(response?.data))}`);
      req.flash('alertType', 'error');
      req.flash('message', response?.data?.message || 'Failed to retrieve MFA mails');
      return res.redirect('/home');
    }

    const { data: mails, totalRecords, totalPages, currentPage } = response.data;

    return res.render(render_ejs_urls.ProductSuiteManagement.MFA_Mail.LIST, {
      enableSuiteManagementLeftMenu: true,
      mails,
      filters: { status },
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
    logger.error(`Controller - [MFAMail]: ${redactLogData(error.message)}`);
    logger.error(redactLogData(error.stack));
    req.flash('alertType', 'error');
    req.flash('message', 'Failed to retrieve MFA mails');
    return res.redirect('/home');
  }
};
