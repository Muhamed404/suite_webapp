const backend_api_urls = require("../../../config/backend_api_urls");
const { logger } = require("../../../logger/logger");
const getApiClient = require('../../../utility/api-client')
const enums = require(`../../../contants/enum`);
const render_ejs_urls = require("../../../config/render_ejs_urls");
const helperFunctions = require("../../../utility/helperFunctions");

exports.renderLicensedUserByProduct = async (req, res) => {
  logger.info(`Controller - Licensed Users By Product: Incoming params ${JSON.stringify(req.params)} and query ${JSON.stringify(req.query)}`);

  let productId = req.params.productId || null;
  let productName = null;

  if (!productId) {
    logger.error('Controller - Licensed Users By Product: Product ID is missing in the request.');
    return res.status(400).send('Product ID is required to fetch licensed users.');
  }

  if (!productId || productId.trim() === '' || !productId) {
    logger.error('Controller - Licensed Users By Product: Invalid Product ID format.');
    return res.status(400).send('Invalid Product ID format.');
  }
  // logger.info(`Controller - Licensed Users By Product: Organization ID - ${organizationId}`);

  if (productId.trim() === 'awm') {
    productId = enums.Product_Selection.AwareMagnus;
    productName = 'awm';
  } else if (productId.trim() === 'phm') {
    productId = enums.Product_Selection.PhishMagnus;
    productName = 'phm';
  } else if (productId.trim() === 'grc') {
    productId = enums.Product_Selection.GRC;
    productName = 'grc';
  } else {
    logger.error('Controller - Licensed Users By Product: Unsupported Product ID provided.');
    return res.status(400).send('Unsupported Product ID provided.');
  }

  let page = parseInt(req.query.page) || 1;
  let pageSize = parseInt(req.query.pageSize) || 10;

  const apiClient = getApiClient(req);
  let url = backend_api_urls.PRODUCT_SUITE.User_Management.LICENSED_USERS_BY_PRODUCT(productId);

  // Append query parameters
  url += `?page=${encodeURIComponent(page)}&pageSize=${encodeURIComponent(pageSize)}`;

  logger.info(`Controller - Licensed Users By Product: URL ${url}`);
  const response = await apiClient.get(url);
  // const users = response.data?.data || [];
  const users = (response.data?.data || []).map(user => ({
    ...user,
    licenses_allocation_date_formatted: user.licenses_allocation_date
      ? helperFunctions.formatDate(user.licenses_allocation_date)
      : ''
  }));
  page = response.data?.page || page;
  pageSize = response.data?.pageSize || pageSize;
  const total = response.data?.total || 0;
  logger.info(`Controller - Licensed Users By Product: Fetched ${users.length} users from backend.`);
  logger.info(`Controller - Licensed Users By Product: ${JSON.stringify(users.slice(0, 2), null, 2)}`);
  if (req.query.requestType && req.query.requestType === 'ajax') {
    logger.info(`Controller - Licensed Users By Product: Sending JSON response for AJAX request.`);
    return res.json({
      productId: productName,
      users: users,
      page: page,
      pageSize: pageSize,
      total: total,
    });
  } else {
    return res.render(render_ejs_urls.ProductSuiteManagement.User_Management.LICENSED_USERS, {
      productId: productName,
      users: users,
      page: page,
      pageSize: pageSize,
      total: total,
    });
  }

};
