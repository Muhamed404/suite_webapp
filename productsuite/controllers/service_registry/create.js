const backend_api_urls = require("../../../config/backend_api_urls");
const frontend_api_urls = require("../../../config/frontend_api_urls");
const render_ejs_urls = require("../../../config/render_ejs_urls");
const { logger } = require("../../../logger/logger");
const getApiClient = require('../../../utility/api-client')

const logTxn = 'Controller - [Service Registry - Create]';


// Render the EJS form
exports.renderForm = (req, res) => {
    logger.info(`${logTxn} - Rendering service registry creation form`);

    return res.render(render_ejs_urls.ProductSuiteManagement.Service_Registry.CREATE, { enableSuiteManagementLeftMenu: true, });
};


exports.submitForm = async (req, res) => {
    logger.info(`${logTxn} - Received request to create service registry`);
    logger.info(`${logTxn} - Request Body: ${JSON.stringify(req.body, null, 2)}`);
    const { service_id, service_name, service_type, public_key } = req.body;

    try {
        // Replace with your backend API URL
        const backendUrl = backend_api_urls.PRODUCT_SUITE.SERVICE_REGISTRY.CREATE;
        const apiClient = getApiClient(req);

        const response = await apiClient.post(backendUrl, {
            service_id,
            service_name,
            service_type,
            public_key
        });

        if (response?.data?.status) {
            logger.info(`${logTxn} - Service registry created successfully`);
            req.flash('message', 'Service registered successfully!');
            req.flash('alertType', 'success');
            return res.redirect(frontend_api_urls.PRODUCT_SUITE.Service_Registry.LIST); // Redirect to a success page

        } else {
            logger.warn(`${logTxn} - Service registry creation failed: ${response.data.message}`);
            throw new Error(response.data.message || 'Service registry creation failed');
        }

    } catch (error) {
        // console.error(error);
        logger.error(`${logTxn} - Error creating service registry: Unable to create service registry`);
        console.error(error);
        req.flash('message', error.response.data.message || 'Unable to create service registry');
        req.flash('alertType', 'error');
        return res.redirect(frontend_api_urls.PRODUCT_SUITE.Service_Registry.CREATE); // Redirect to a success page
    }
};