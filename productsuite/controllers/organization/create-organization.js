
const config = require("../../../config/env.config");
const { logger } = require("../../../logger/logger");
const enums = require("../../../contants/enum");
const moment = require("moment");
const getApiClient = require("../../../utility/api-client");
const render_ejs_urls = require("../../../config/render_ejs_urls");



exports.createOrganization = async (req, res) => {
  if (req.method === "GET") {
    logger.info(`[CREATE ORGANIZATION]:: Incoming GET Request`);
    const countryUrl = `/phm/commons/`;
    const packageUrl = `/package/getPackages`;
    const serviceUrl = `/phm/services/`;
    const apiClient = getApiClient(req);
    return Promise.all([
      apiClient.get(countryUrl),
      // apiClient.get(packageUrl),
      // apiClient.get(serviceUrl),
    ])
      .then(([response1, response2, serviceResponse]) => {
        const countries = response1.data.countries;
        // const package = response2.data.Package;
        // const services = serviceResponse.data.services;
        logger.info(`[CREATE ORGANIZATION]:: Rendring Add Organization EJS Page`);
        // logger.info(`............... ${JSON.stringify(services)}`);
        // logger.info(package);
        res.render(render_ejs_urls.ProductSuiteManagement.Organization.CREATE, {
          enableSuiteManagementLeftMenu: true,
          countries,
          Package: null,
          Services: null,
        });
      })
      .catch((error) => {
        logger.error(`[Create Organization]: GET: Issue in creation.` + error.stack)
        throw error;
      });
  } else if (req.method === "POST") {
    logger.info(`[CREATE ORGANIZATION]:: Incoming POST Request`);
    try {
      logger.info(`[CREATE ORGANIZATION]:: [${req.method}] Incoming Body Payload ${JSON.stringify(req.body)}`);
      const organization = {
        name: req.body.name,
        address: req.body.address,
        country: parseInt(req.body.country),
        state: parseInt(req.body.state),
        city: parseInt(req.body.city),
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        password: req.body.password,
        email: req.body.email,
        postalCode: parseInt(req.body.postalCode),
        // package: parseInt(req.body.package),
        // totalUserLicenses: parseInt(req.body.totalLicenses),
        // licenseStartDate: req.body.licenseStartDate,
        contact: req.body.contact
      };
      logger.info(`[CREATE ORGANIZATION]:: Organization Creation Final Payload ${JSON.stringify(organization)}`);
      const apiClient = getApiClient(req);
      const response = await apiClient.post('/organization/', organization);
      logger.info(`[CREATE ORGANIZATION]:: Response ${response.data.message}`);
      res.redirect(`/organization/?message=${response.data.message}&alertType=success&alertSwal=true`);
    } catch (error) {
      logger.error(`[CREATE ORGANIZATION]:: ${error}`);
      res.render("pages/product_suite_management/suite_management", {
        message: "Error in saving",
        alertType: "error",
      });
    }
  }
}