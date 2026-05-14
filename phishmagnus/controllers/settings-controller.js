const { validationResult } = require("express-validator");

const { logger } = require("../../logger/logger");
const { redactLogData } = require("../utility/redact");
const getApiClient = require('../../utility/api-client')


exports.deleteById = async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.info(errors.array());
    return res.render("pages/view-package", {
      enableSuiteManagementLeftMenu: true,
      message: "Provided Param is invalid",
      alertType: "error",
    });
  }

  // Extract the ID from the request parameters
  const { id } = req.params;
  logger.info(`inside package controller delete by id ${id}`);

  // Make a request to another API (replace 'API_ENDPOINT' with the actual endpoint)
  const apiClient = getApiClient(req);
  const url = `/package/${id}`;
  logger.info(url);
  // Send DELETE request
  apiClient
    .delete(url)
    .then((response) => {
      logger.info("DELETE request successful");

      const data = response.data;
      logger.info("Response:", data.message);
      res.redirect(
        `/package/list?message=${data.message}&alertType=${data.alertType}`
      );
      // res.render("pages/view-package", {
      //   message: data.message,
      //   alertType: data.alertType,
      // });
    })
    .catch((error) => {
      console.error("exception creating package:", redactLogData(error.response?.data));
      const err = error.response.data;
      res.redirect(
        `/package/list?message=${err.message}&alertType=${err.alertType}`
      );
    });
};


