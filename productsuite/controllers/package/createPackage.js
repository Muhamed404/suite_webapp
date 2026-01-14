const { validationResult } = require("express-validator");
const config = require("../../../config/env.config");
const getApiClient = require('../../../utility/api-client');
const render_ejs_urls = require("../../../config/render_ejs_urls");
const backend_api_urls = require("../../../config/backend_api_urls");
const frontend_api_urls = require("../../../config/frontend_api_urls");
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
        // Validate required fields (server-side validation as backup to client-side)
        const requiredFields = [
            'name',
            'description',
            'package_type',
            'application',
            'per_license_cost',
            'license_range_from',
            'license_range_to',
            'duration_days'
        ];

        const missingFields = requiredFields.filter(field => !req.body[field]);

        if (missingFields.length > 0) {
            logger.warn(`[PACKAGE CREATE][POST] Missing required fields: ${missingFields.join(', ')}`);

            // Fetch applications for re-rendering
            let applications = [];
            try {
                const apiUrl = backend_api_urls.PRODUCT_SUITE.Application.LIST;
                const apiClient = getApiClient(req);
                const appsRes = await apiClient.get(apiUrl);
                applications = appsRes.data?.object || [];
            } catch (e) {
                logger.error(`[PACKAGE CREATE][POST] Error fetching applications: ${e.message}`);
            }

            return res.render(render_ejs_urls.ProductSuiteManagement.Package_Management.CREATE, {
                applications,
                message: `Missing required fields: ${missingFields.join(', ')}`,
                alertType: "error",
                enableSuiteManagementLeftMenu: true,
            });
        }

        // Parse and validate numeric fields
        const per_license_cost = parseInt(req.body.per_license_cost, 10);
        const license_range_from = parseInt(req.body.license_range_from, 10);
        const license_range_to = parseInt(req.body.license_range_to, 10);
        const duration_days = parseInt(req.body.duration_days, 10);

        // Validate numeric values
        if (isNaN(per_license_cost) || per_license_cost < 1) {
            throw new Error('License cost must be at least 1');
        }
        if (isNaN(license_range_from) || license_range_from < 1) {
            throw new Error('User range (From) must be at least 1');
        }
        if (isNaN(license_range_to) || license_range_to < 1) {
            throw new Error('User range (To) must be at least 1');
        }
        if (isNaN(duration_days) || duration_days < 1) {
            throw new Error('Duration must be at least 1 day');
        }

        // Validate range: license_range_to must be >= license_range_from
        if (license_range_to < license_range_from) {
            throw new Error('User range "To" must be greater than or equal to "From"');
        }

        // Prepare payload from form fields - all fields are required
        const payload = {
            name: req.body.name.trim(),
            description: req.body.description.trim(),
            package_type: req.body.package_type,
            application: req.body.application,
            per_license_cost: per_license_cost,
            license_range_from: license_range_from,
            license_range_to: license_range_to,
            duration_days: duration_days,
        };

        logger.info(`[PACKAGE CREATE][POST] Payload: ${JSON.stringify(payload, null, 2)}`);

        // Send payload to backend API
        const apiUrl = backend_api_urls.PRODUCT_SUITE.PACKAGE_MANAGEMENT.CREATE;
        const apiClient = getApiClient(req);
        const response = await apiClient.post(apiUrl, payload);

        logger.info(`[PACKAGE CREATE][POST] Backend response: ${JSON.stringify(response.data)}`);

        // Redirect or render success
        req.flash('message', 'Package created successfully');
        req.flash('alertType', 'success');
        res.redirect(frontend_api_urls.PRODUCT_SUITE.Package_Management.LIST_PACKAGES);
    } catch (error) {
        logger.error(`[PACKAGE CREATE][POST] Error: ${error.message || error}`);

        // Fetch applications again for re-rendering the form with error
        let applications = [];
        try {
            const apiUrl = backend_api_urls.PRODUCT_SUITE.Application.LIST;
            const apiClient = getApiClient(req);
            const appsRes = await apiClient.get(apiUrl);
            applications = appsRes.data?.object || [];
        } catch (e) {
            logger.error(`[PACKAGE CREATE][POST] Error fetching applications for error page: ${e.message}`);
        }

        res.render(render_ejs_urls.ProductSuiteManagement.Package_Management.CREATE, {
            applications,
            message: error.message || "Error creating package. Please try again.",
            alertType: "error",
            enableSuiteManagementLeftMenu: true,
        });
    }
};
