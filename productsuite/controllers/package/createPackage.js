const { validationResult } = require("express-validator");
const config = require("../../../config/env.config");
const getApiClient = require('../../../utility/api-client');
const render_ejs_urls = require("../../../config/render_ejs_urls");
const backend_api_urls = require("../../../config/backend_api_urls");
const logger = require("../../../logger/logger").logger;



exports.renderCreateForm = async (req, res) => {
    if (req.method === "GET") {
        try {
            const apiUrl = backend_api_urls.PRODUCT_SUITE.Application.LIST;
            logger.info(`[PACKAGE CREATE][GET] Fetching applications from: ${apiUrl}`);
            const apiClient = getApiClient(req);
            const response = await apiClient.get(apiUrl);
            const applications = response.data?.object || []; // Use .result if that's your API format

            logger.info(`[PACKAGE CREATE][GET] Applications fetched: ${applications.length}`);
            // logger.info(`[PACKAGE CREATE][GET] Applications response: ${JSON.stringify(applications, null, 2)}`);

            res.render(render_ejs_urls.ProductSuiteManagement.Package_Management.CREATE, {
                applications,
                enableSuiteManagementLeftMenu: true,
            });
        } catch (error) {
            logger.error(`[PACKAGE CREATE][GET] Error: ${error.stack || error}`);
            res.render(render_ejs_urls.ProductSuiteManagement.Package_Management.CREATE, {
                applications: [],
                message: "Could not load applications.",
                alertType: "error",
            });
        }
    } else {
        logger.warn(`[PACKAGE CREATE] Unsupported HTTP method: ${req.method}`);
        res.status(405).send("Method Not Allowed");
    }
};




exports.submitPackageForm = async (req, res) => {
    try {
        // Prepare payload from form fields
        const payload = {
            name: req.body.name,
            description: req.body.description,
            package_type: req.body.package_type,
            application: req.body.application || req.body.app_id, // adjust based on your select's name
            per_license_cost: req.body.per_license_cost ? parseInt(req.body.per_license_cost, 10) : 0,
            license_range_from: req.body.license_range_from ? parseInt(req.body.license_range_from, 10) : null,
            license_range_to: req.body.license_range_to ? parseInt(req.body.license_range_to, 10) : null,
            duration_days: req.body.duration_days ? parseInt(req.body.duration_days, 10) : null,
        };

        logger.info(`[PACKAGE CREATE][POST] Payload: ${JSON.stringify(payload, null, 2)}`);

        // Send payload to backend API
        const apiUrl = backend_api_urls.PRODUCT_SUITE.PACKAGE_MANAGEMENT.CREATE;
        const apiClient = getApiClient(req);
        const response = await apiClient.post(apiUrl, payload);

        logger.info(`[PACKAGE CREATE][POST] Backend response: ${JSON.stringify(response.data)}`);

        // Redirect or render success
        res.redirect('/package/list?message=Package created successfully&alertType=success');
    } catch (error) {
        logger.error(`[PACKAGE CREATE][POST] Error: ${error.message}`);
        // Optionally, fetch applications again for re-rendering the form with error
        let applications = [];
        try {
            const appsRes = await axios.get(backend_api_urls.PRODUCT_SUITE.APPLICATION.LIST);
            applications = appsRes.data?.result || [];
        } catch (e) {
            logger.error(`[PACKAGE CREATE][POST] Error fetching applications for error page: ${e.message}`);
        }
        res.render(render_ejs_urls.ProductSuiteManagement.Package_Management.CREATE, {
            applications,
            message: "Error creating package. Please try again.",
            alertType: "error",
        });
    }
};