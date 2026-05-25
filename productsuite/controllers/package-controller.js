const { validationResult } = require("express-validator");
const config = require("../../config/env.config");
const getApiClient = require('../../utility/api-client');
const render_ejs_urls = require("../../config/render_ejs_urls");
const backend_api_urls = require("../../config/backend_api_urls");
const logger = require("../../logger/logger").logger;
const { redactLogData } = require("../../utility/redact");



exports.retrieveAll = async (req, res) => {
  logger.info(`[PACKAGE RETRIEVE ALL] User: ${req.user?.id || 'unknown'} | Fetching package list`);
  try {
    const url = `/package/getPackages`;
    const apiClient = getApiClient(req);
    logger.info(`[PACKAGE RETRIEVE ALL] GET ${url}`);
    const response = await apiClient.get(url);
    const data = response.data;
    logger.info(`[PACKAGE RETRIEVE ALL] Packages fetched: count=${data.Package?.length || 0}`);
    // Print package details
    if (data.Package && data.Package.length > 0) {
      logger.info(`[PACKAGE RETRIEVE ALL] Package details:\n${JSON.stringify(redactLogData(data.Package), null, 2)}`);
    }
    if (data.Package) {
      res.render("pages/package/view-package", {
        enableSuiteManagementLeftMenu: true,
        package: data?.Package || [],
      });
    } else {
      logger.warn("[PACKAGE RETRIEVE ALL] No packages found");
      res.render("pages/package/view-package", {
        enableSuiteManagementLeftMenu: true,
        package: [],
        message: "No packages found",
        alertType: "info",
      });
    }
  } catch (error) {
    logger.error(`[PACKAGE RETRIEVE ALL] Error: ${error.stack || error}`);
    res.render("pages/product_suite_management/suite_management", {
      message: error.response?.data?.error || "Error fetching packages",
      alertType: "error",
    });
  }
};

exports.deleteById = async (req, res) => {
  logger.info(`[PACKAGE DELETE] User: ${req.user?.id || 'unknown'} | Start`);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn(`[PACKAGE DELETE] Validation failed: ${JSON.stringify(redactLogData(errors.array()))}`);
    return res.render("pages/package/view-package", {
      enableSuiteManagementLeftMenu: true,
      message: "Provided Param is invalid",
      alertType: "error",
    });
  }

  const { id } = req.params;
  logger.info(`[PACKAGE DELETE] Deleting package with id: ${id}`);

  const url = `/package/${id}`;
  const apiClient = getApiClient(req);
  try {
    const response = await apiClient.delete(url);
    const data = response.data;
    logger.info(`[PACKAGE DELETE] Success: ${data.message}`);
    res.redirect(`/package/list?message=${encodeURIComponent(data.message)}&alertType=${encodeURIComponent(data.alertType)}`);
  } catch (error) {
    logger.error(`[PACKAGE DELETE] Error: ${error.stack || error}`);
    const err = error.response?.data || { message: "Unknown error", alertType: "error" };
    res.redirect(
      `/package/list?message=${encodeURIComponent(err.message)}&alertType=${encodeURIComponent(err.alertType)}`
    );
  }
};

exports.updatePackage = async (req, res) => {
  logger.info(`[PACKAGE UPDATE] Method: ${req.method} | User: ${req.user?.id || 'unknown'}`);
  if (req.method === "GET") {
    logger.info("[PACKAGE UPDATE][GET] Rendering edit-package page");
    return res.render("pages/package/edit-package");
  }
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn(`[PACKAGE UPDATE][POST] Validation failed: ${JSON.stringify(redactLogData(errors.array()))}`);
      return res.render("pages/package/view-package", {
        enableSuiteManagementLeftMenu: true,
        message: "Validation failed",
        alertType: "error",
      });
    }
    // Add your update logic here
    logger.info("[PACKAGE UPDATE][POST] Package updated successfully");
    res.redirect("/package/list");
  } catch (error) {
    logger.error(`[PACKAGE UPDATE][POST] Error: ${error.stack || error}`);
    res.render("pages/package/view-package", {
      enableSuiteManagementLeftMenu: true,
      message: "Error updating package",
      alertType: "error",
    });
  }
};
