
const backend_api_urls = require("../../../config/backend_api_urls");
const { logger } = require("../../../logger/logger");
const getApiClient = require('../../../utility/api-client')
const enums = require('../../../contants/enum')


exports.retrieveLicenseInformationByProductEnumKey = async (req, res) => {
    logger.info(`[Retrieve License By Product Enum Key]: Incoming Params ${JSON.stringify(req.params, null, 2)}`);
    try {
        const selectedProductKey = req.params.selectedProductKey;
        const productEnumKey = Object.keys(enums.Product_Selection).find(
            key => enums.Product_Selection[key] === Number(selectedProductKey)
        );
        if (!productEnumKey) {
            logger.error(`[Retrieve License By Product Enum Key]: Invalid product enum key: ${selectedProductKey}`);
            return res.status(400).send("Invalid product selection.");
        }
        const apiClient = getApiClient(req);
        const url = backend_api_urls.PRODUCT_SUITE.LICENSE_INFORMATION.RETRIEVE_BY_PRODUCT_ENUM_KEY(selectedProductKey);

        logger.info(`[Retrieve License By Product Enum Key]: URL ${url}`);
        const response = await apiClient.get(url);

        logger.info(`[Retrieve License By Product Enum Key]: Response from API ${JSON.stringify(response.data, null, 2)}`);
        const { message, object } = response.data;
        logger.info(`[Retrieve License By Product Enum Key]: Message: ${message}, Object: ${JSON.stringify(object, null, 2)}`);

        if (!object || Object.keys(object).length === 0) {
            return res.status(400).send({ filteredLicense: { availableLicenses: 0 } });
        }

        let filteredLicense = object;


        if (selectedProductKey !== undefined && Number(selectedProductKey) === Number(enums.Product_Selection.PhishMagnus)) {
            filteredLicense = { availableLicenses: filteredLicense.PhishMagnus.Subscription.TotalAvailable };
        } else if (selectedProductKey !== undefined && Number(selectedProductKey) === Number(enums.Product_Selection.AwareMagnus)) {
            filteredLicense = { availableLicenses: filteredLicense.AwareMagnus.Subscription.TotalAvailable };
        } else if (selectedProductKey !== undefined && Number(selectedProductKey) === Number(enums.Product_Selection.GRC)) {
            filteredLicense = { availableLicenses: filteredLicense.GRC.Subscription.TotalAvailable };
        } else if (selectedProductKey !== undefined && Number(selectedProductKey) === Number(enums.Product_Selection.All)) {
            const phishLicenses = filteredLicense.PhishMagnus ? filteredLicense.PhishMagnus.Subscription.TotalAvailable : 0;
            const awareLicenses = filteredLicense.AwareMagnus ? filteredLicense.AwareMagnus.Subscription.TotalAvailable : 0;
            filteredLicense = { 
                availableLicenses: Math.min(phishLicenses, awareLicenses),
                phishLicenses: phishLicenses,
                awareLicenses: awareLicenses
            };
        } else {
            filteredLicense = { availableLicenses: 0 };
        }
        logger.info(`[Retrieve License By Product Enum Key]: Filtered License: ${JSON.stringify(filteredLicense, null, 2)}`);
        if (Number(selectedProductKey) === Number(enums.Product_Selection.All)) {
            // For All, always return success to show both licenses
            return res.status(200).send({ filteredLicense });
        } else if (filteredLicense.availableLicenses > 0) {
            return res.status(200).send({ filteredLicense });
        }
        return res.status(400).send({ filteredLicense: { availableLicenses: 0 } });
    } catch (error) {
        logger.error(`[Retrieve License By Product Enum Key]: Error occurred - ${error.message}`);
        logger.error(error.stack);
        return res.status(400).send("An error occurred while retrieving license information.");
    }
};
