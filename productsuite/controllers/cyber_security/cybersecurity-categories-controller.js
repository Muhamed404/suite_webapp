const config = require("../../../config/env.config");

const { logger } = require("../../../logger/logger");
const getApiClient = require('../../../utility/api-client')
const { redactLogData } = require("../../../utility/redact");


exports.create = async (req, res) => {
  if (req.method === "GET") {
    logger.info("inside create method of cybersecurity");
    const message = req.query.message || null;
    const alertType = req.query.alertType || null;
    const formData = {
      name: req.query.name || '',
      code: req.query.code || '',
      description: req.query.description || ''
    };
    return res.render('pages/categories/add-cybersecurity-categories',{enableSuiteManagementLeftMenu:true, message, alertType, formData})
         
  } else if (req.method === "POST") {
    const apiClient = getApiClient(req);
    let payload = {
      name: req.body.name,
      code: req.body.code,
      description: req.body.description,
    };
    logger.info("Posting payload of cybersecurity " + JSON.stringify(redactLogData(payload)));
    const url = `/cybersecurity/categories/`;
    logger.info("url in post create cybersecurity category url " + redactLogData(url));
    return Promise.all([apiClient.post(url, payload)])
      .then(([response]) => {
        let message = response.data.message;
        let alertType = response.data.alertType;
        res.redirect(  `/cybersecurity/categories/list?message=${message}&alertType=${alertType}`);
      })
      .catch((error) => {
        logger.error(`${redactLogData(error.message)}`);
        logger.error(redactLogData(error));
        logger.error(redactLogData(error.stack));
        const errorMessage = error.response?.data?.message || error.message || 'Error creating category';
        const alertType = error.response?.data?.alertType || 'error';
        const queryParams = new URLSearchParams({
          message: errorMessage,
          alertType: alertType,
          name: payload.name || '',
          code: payload.code || '',
          description: payload.description || ''
        });
        res.redirect(`/cybersecurity/categories/?${queryParams.toString()}`);
      });
  }
};

exports.findAllByOrganization = async (req, res) => {
 const apiClient = getApiClient(req);
    logger.info("inside findAllByOrganization method of cybersecurity");
    const url = `/cybersecurity/categories/list`;
    logger.info("url in cybersecurity category list url " + redactLogData(url));
    return Promise.all([apiClient.get(url)])
      .then(([response]) => {
        let categories = response.data.message;
        return res.render("pages/categories/view-categories",{categories,enableSuiteManagementLeftMenu:true});
      })
      .catch((error) => {
        logger.error('Exception in findAllByOrganization')
        logger.error(`${redactLogData(error.message)}`);
        logger.error(redactLogData(error.stack));
        res.redirect("/?message=Contact to Administrator&alertType=error");
      });
  
};


exports.disableCategory = async (req, res) => {
 const apiClient = getApiClient(req);
  logger.info("inside disableCategory method of cybersecurity");
  let catId = req.params.catId;
  const url = `/cybersecurity/categories/disableCategory/${catId}`;
  logger.info("url in cybersecurity category disableCategory url " + redactLogData(url));
  return Promise.all([apiClient.post(url)])
    .then(([response]) => {

      res.redirect(  `/cybersecurity/categories/list?message=Request has been submitted&alertType=info`);
    })
    .catch((error) => {
      logger.error('Exception in disableCategory')
      logger.error(`${redactLogData(error.message)}`);
      logger.error(redactLogData(error.stack));
      res.redirect("/?message=Contact to Administrator&alertType=error");
    });

};
