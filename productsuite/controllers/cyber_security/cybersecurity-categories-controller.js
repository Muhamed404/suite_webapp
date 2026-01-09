const config = require("../../../config/env.config");

const { logger } = require("../../../logger/logger");
const getApiClient = require('../../../utility/api-client')


exports.create = async (req, res) => {
  if (req.method === "GET") {
    logger.info("inside create method of cybersecurity");
    return res.render('pages/categories/add-cybersecurity-categories',{enableSuiteManagementLeftMenu:true})
         
  } else if (req.method === "POST") {
    const apiClient = getApiClient(req);
    let payload = {
      name: req.body.name,
      code: req.body.code,
      description: req.body.description,
    };
    logger.info("Posting payload of cybersecurity " + payload);
    const url = `/cybersecurity/categories/`;
    logger.info("url in post create cybersecurity category url " + url);
    return Promise.all([apiClient.post(url, payload)])
      .then(([response]) => {
        let message = response.data.message;
        let alertType = response.data.alertType;
        res.redirect(  `/cybersecurity/categories/list?message=${message}&alertType=${alertType}`);
      })
      .catch((error) => {
        logger.error(`${error.message}`);
        logger.error(error);
        logger.error(error.stack);
        res.redirect("/?message=Contact to Administrator&alertType=error");
      });
  }
};

exports.findAllByOrganization = async (req, res) => {
 const apiClient = getApiClient(req);
    logger.info("inside findAllByOrganization method of cybersecurity");
    const url = `/cybersecurity/categories/list`;
    logger.info("url in cybersecurity category list url " + url);
    return Promise.all([apiClient.get(url)])
      .then(([response]) => {
        let categories = response.data.message;
        return res.render("pages/categories/view-categories",{categories,enableSuiteManagementLeftMenu:true});
      })
      .catch((error) => {
        logger.error('Exception in findAllByOrganization')
        logger.error(`${error.message}`);
        logger.error(error.stack);
        res.redirect("/?message=Contact to Administrator&alertType=error");
      });
  
};


exports.disableCategory = async (req, res) => {
 const apiClient = getApiClient(req);
  logger.info("inside disableCategory method of cybersecurity");
  let catId = req.params.catId;
  const url = `/cybersecurity/categories/disableCategory/${catId}`;
  logger.info("url in cybersecurity category disableCategory url " + url);
  return Promise.all([apiClient.post(url)])
    .then(([response]) => {

      res.redirect(  `/cybersecurity/categories/list?message=Request has been submitted&alertType=info`);
    })
    .catch((error) => {
      logger.error('Exception in disableCategory')
      logger.error(`${error.message}`);
      logger.error(error.stack);
      res.redirect("/?message=Contact to Administrator&alertType=error");
    });

};
