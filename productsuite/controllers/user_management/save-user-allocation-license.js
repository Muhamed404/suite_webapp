const backend_api_urls = require("../../../config/backend_api_urls");
const frontend_api_urls = require("../../../config/frontend_api_urls");
const { logger } = require("../../../logger/logger");
const getApiClient = require("../../../utility/api-client");
const enums = require("../../../contants/enum");
const { log } = require("winston");

async function saveUserAllocationLicense(req, res, next) {
    try {
        logger.info("Controller - Save User Allocation License: Incoming request.");
        const { selectedUsers } = req.body;
        const productName = req.body?.productId || req.query?.actionProduct || null;
        console.log("Product Name in Save User Allocation License Controller:" + productName);
        // if user clicked on unenroll button, then param will be 'true'
        const hasRequestedToUnenroll = req.params?.hasRequestedToUnenroll === 'true';

        if (!productName) {
            logger.info(`Controller - Save User Allocation License: productName received as query param: ${productName}`);
            req.flash('alertType', 'error');
            req.flash('message', 'Action not allowed while managing licenses from Product Action page.');
            return res.redirect(frontend_api_urls.PRODUCT_SUITE.User_Management.SUITE_USERS);

        }
        logger.info("Controller - Save User Allocation License: selectedUsers from body: " + JSON.stringify(selectedUsers, null, 2));

        // Ensure selectedUsers is always an array
        const safeSelectedUsers = Array.isArray(selectedUsers)
            ? selectedUsers.map(Number)
            : selectedUsers
                ? [Number(selectedUsers)]
                : [];

        if (safeSelectedUsers.length === 0) {
            logger.error("Controller - selected user length is zero");
            return res.redirect(frontend_api_urls.PRODUCT_SUITE.User_Management.SUITE_USERS);
        }

        let productId = null;
        if (productName && productName === 'awm') {
            productId = Number(enums.Product_Selection.AwareMagnus);
        } else if (productName === 'phm') {
            productId = Number(enums.Product_Selection.PhishMagnus);
        }

        logger.info(`Controller - Save User Allocation License: productName: ${productName}, Mapped productId: ${productId}`);


        let url = backend_api_urls.PRODUCT_SUITE.User_Management.SAVE_ENROLLMENT(hasRequestedToUnenroll);

        if (productId) {
            // If url already has query params, use & instead of ?
            url += (url.includes('?') ? '&' : '?') + 'productId=' + encodeURIComponent(productId);
        }
        logger.info(`Controller - Save User Allocation License: Final URL constructed: ${url}`);
        const apiClient = getApiClient(req);
        const response = await apiClient.post(url, { safeSelectedUsers })

        const message = response.data?.message || 'enrollment updated successfully';
        if (!response.data?.success) {
            logger.error("Controller - Save User Allocation License: API response indicated failure: " + message);
            return res.status(200).json({
                success: false,
                message,
                redirect: frontend_api_urls.PRODUCT_SUITE.User_Management.SUITE_USERS
            });
        }
        return res.status(200).json({ success: true, unassignedUsers: message });

    } catch (error) {
        logger.error("Error - Controller - Save User Allocation License: " + error.stack);
        req.flash('alertType', 'error');
        req.flash('message', 'Error in saving user allocation license');
        return res.redirect(frontend_api_urls.PRODUCT_SUITE.User_Management.SUITE_USERS);
    }
}

module.exports = {
    saveUserAllocationLicense
}