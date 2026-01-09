const { log } = require("winston");
const backend_api_urls = require("../../../config/backend_api_urls");
const frontend_api_urls = require("../../../config/frontend_api_urls");
const render_ejs_urls = require("../../../config/render_ejs_urls");
const { logger } = require("../../../logger/logger");
const getApiClient = require('../../../utility/api-client')

const logTxn = 'Controller - [Service Registry - Retrieve All]';

exports.retrieveServiceList = async (req, res) => {
    try {
        logger.info(`${logTxn} - Fetching service registry list`);
        const page = req.query.page || 1;
        const limit = req.query.limit || 10;

        // Call backend API
        const apiClient = getApiClient(req);

        const response = await apiClient.get(backend_api_urls.PRODUCT_SUITE.SERVICE_REGISTRY.LIST, {
            params: { page, limit },
        });

        const result = response.data;
        logger.info(`${logTxn} - Successfully fetched service registry list`);
        logger.info(`${logTxn} - Response Data: ${JSON.stringify(result, null, 2)}`);
        console.log(JSON.stringify('?????? '+JSON.stringify(result.data, null, 2)));

        res.render(render_ejs_urls.ProductSuiteManagement.Service_Registry.LIST, {
            enableSuiteManagementLeftMenu: true,

            services: result.data,
            pagination: {
                totalPages: result.totalPages,
                totalRecords: result.totalRecords,
                currentPage: result.currentPage,
                totalCount: result.data.length || 0,
            },
        });
    } catch (error) {
        // console.error("Error fetching service registry:", error.message);
        logger.error(`${logTxn} - Error fetching service registry: ${error.message}`);
        res.render("serviceRegistryList", {
            services: [],
            pagination: { totalPages: 0, currentPage: 1 },
            error: "Failed to fetch service registry data.",
        });
    }
};
