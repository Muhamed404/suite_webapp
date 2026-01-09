const config = require("../../../config/env.config");
const { logger } = require("../../../logger/logger");
const getApiClient = require("../../../utility/api-client");
const BACKEND_URLS = require('../../../config/backend_api_urls')


async function retrieveSuiteManagementLicenseInformation(req) {
    try {
        logger.info(`[License Information]: INCOMING REQUEST`);
        logger.info("PHISH MAGNUS LICENSE DETAILS ::: BY MAGNUS ADMIN CALLING API");
        let url = `/suite/management/information`;
        logger.info(`[License Information]: AXIOS URL ${url}`);
        const apiClient = getApiClient(req);
        const response = await apiClient.get(url);
        logger.info('[License Information]:' + JSON.stringify({
            status: response.status,
            data: response.data,
            headers: response.headers,
        }, null, 2));
        return response.data?.message || null;
    } catch (error) {
        logger.error("ERROR: " + error.message);
        logger.error(error.stack);
        return null;
    }
}


async function retrieveAwareMagnusOrganizationLicenseDetails(req) {
    try {
        logger.info(`[AWM License Detail]: INCOMING REQUEST`);
        let url = BACKEND_URLS.PRODUCT_SUITE.LICENSE_INFORMATION;
        logger.info(`[AWM License Detail]: Backend API URL: ${url}`);
        const apiClient = getApiClient(req);
        const response = await apiClient.get(url);
        logger.info('[AWM License Detail]: User License Respose Details' + JSON.stringify({
            status: response.status,
            data: response.data,
            headers: response.headers,
        }, null, 2));
        return response.data?.message || null;
    } catch (error) {
        logger.error("[AWM License Detail]: Err- " + error.message);
        logger.error("[AWM License Detail]: " + error.stack);
        return null;
    }
}


module.exports = {
    retrieveSuiteManagementLicenseInformation,
    retrieveAwareMagnusOrganizationLicenseDetails
};

