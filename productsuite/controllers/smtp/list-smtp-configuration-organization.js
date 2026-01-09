 
const { logger } = require("../../../logger/logger");
const getApiClient = require('../../../utility/api-client')

 
exports.showAllSMTPByOrganization = (req, res) => {
  logger.info("enter in fetching list of showAllSMTPByOrganization::::");

  const url = `/settings/smtp/`;
  const apiClient = getApiClient(req);
  logger.info(`complete url ${url}`);
  apiClient
    .get(url)
    .then((response) => {
      const data = response.data;
      logger.info(`data is ${JSON.stringify(data)}`);

      logger.info(`${JSON.stringify(data.message)}`);
      res.render("pages/settings/smtp/list-smtps", { SMTP: data.message });
      // res.redirect(`/?message=${data.message}&alertType=${data.alertType}`);
    })
    .catch((error) => {
      logger.error(`issue in retriving smtps`);
      logger.info(error.response.data);
      let data = error.response.data;
      res.redirect(`/phm/?message=${data.message}&alertType=${data.alertType}`);
    });
};

