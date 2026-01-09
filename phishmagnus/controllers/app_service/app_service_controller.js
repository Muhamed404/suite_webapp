const axios = require("axios");
const { validationResult } = require("express-validator");
const backend_api_urls = require("../../config/backend_api_urls");
const render_ejs_urls = require("../../config/render_ejs_urls");
const logger = require("../../logger/logger").logger;

exports.renderCreateForm = async (req, res) => {
  try {
    // Fetch applications for the dropdown
    const response = await axios.get(backend_api_urls.PRODUCT_SUITE.APPLICATION.LIST);
    const applications = response.data?.result || [];
    res.render("pages/app_service/create_app_service", { applications, message: null, alertType: null });
  } catch (error) {
    logger.error(`[APP SERVICE][GET] Error fetching applications: ${error.message}`);
    res.render("pages/app_service/create_app_service", { applications: [], message: "Could not load applications.", alertType: "error" });
  }
};

exports.createAppService = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Fetch applications again for re-rendering the form
    let applications = [];
    try {
      const response = await axios.get(backend_api_urls.PRODUCT_SUITE.APPLICATION.LIST);
      applications = response.data?.result || [];
    } catch (e) {}
    return res.render("pages/app_service/create_app_service", {
      applications,
      message: errors.array().map(e => e.msg).join("<br>"),
      alertType: "error",
    });
  }

  try {
    const payload = {
      app_id: req.body.app_id,
      service_name: req.body.service_name,
      service_detail: req.body.service_detail,
      type: req.body.type,
      per_service_cost: req.body.per_service_cost ? parseInt(req.body.per_service_cost, 10) : 0,
    };
    logger.info(`[APP SERVICE][POST] Payload: ${JSON.stringify(payload)}`);
    const apiUrl = backend_api_urls.PRODUCT_SUITE.APP_SERVICE.CREATE;
    const response = await axios.post(apiUrl, payload);
    logger.info(`[APP SERVICE][POST] Backend response: ${JSON.stringify(response.data)}`);
    res.redirect('/app_service/list?message=Service created successfully&alertType=success');
  } catch (error) {
    logger.error(`[APP SERVICE][POST] Error: ${error.message}`);
    let applications = [];
    try {
      const response = await axios.get(backend_api_urls.PRODUCT_SUITE.APPLICATION.LIST);
      applications = response.data?.result || [];
    } catch (e) {}
    res.render("pages/app_service/create_app_service", {
      applications,
      message: "Error creating service. Please try again.",
      alertType: "error",
    });
  }
};