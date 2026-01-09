const config = require("../../../config/env.config");

const { logger } = require("../../../logger/logger");
const enums = require("../../../contants/enum");
const getApiClient = require('../../../utility/api-client')


// exports.reportCampaign = async (req, res) => {
//   logger.info('REPORT CAMPAIGN METHOD::: CAMPAIGN REPORT STARTED')
//   try {
//     if (req.method === "GET") {
//       let user = req.user;
//       let isCompletedTabSelected = req.params.completedSelectedTab ? true : false;
//       let url = `/campaign/email/report/`;
//       const apiClient = getApiClient(req);
//       logger.info('REPORT CAMPAIGN METHOD::: URL '+url)
//       const response = await apiClient.get(url);
//       const report = response.data.message;
//       res.render("pages/campaign/campaign-report",{report});
//     }
//   } catch (error) {
//     logger.error('REPORT CAMPAIGN METHOD::: EXCEPTION REPORT STARTED')
//     logger.error(`${error.message}`);
//     logger.error(error);
//     logger.error(error.stack);
//     res.redirect("/phm/?message=ERROR IN REPORT&alertType=error");
//   }
// };



// exports.reportCompletedCampaign = async (req, res) => {
//   logger.info('[Completed Tab Report]: CAMPAIGN REPORT STARTED')
//   try {
//     if (req.method === "GET") {
  
 
//       let url = `/campaign/email/report/true`;
//       const apiClient = getApiClient(req);
//       logger.info('[Completed Tab Report]: URL '+url)
//       const response = await apiClient.get(url);
       
//       return res.json(response.data.message);
//     }
//   } catch (error) {
//     logger.error('REPORT CAMPAIGN METHOD::: EXCEPTION REPORT STARTED')
//     logger.error(`${error.message}`);
//     logger.error(error);
//     logger.error(error.stack);
//     res.redirect("/phm/?message=ERROR IN REPORT&alertType=error");
//   }
// };