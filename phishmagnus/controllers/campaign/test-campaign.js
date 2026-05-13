
const { logger } = require("../../../logger/logger");
const ICONSTANTS = require("../../../contants/ICONSTANTS");
const enums = require("../../../contants/enum");
const getApiClient = require('../../../utility/api-client')
const { redactLogData } = require("../../utility/redact");
exports.testCampaign = async (req, res) => {
  logger.info('TEST CAMPAIGN METHOD::: CAMPAIGN CREATION STARTED')
  try {
    
      logger.info(`Body ${JSON.stringify(redactLogData(req.body))}`);
      let user = req.user;
      let payload = req.body;
      if (payload.template === null || payload.template === undefined || payload.template === "") {
        payload.template = payload.systemTemplate;
        logger.info('Assigning template of from system template into template field '+payload.template)        
      }
      logger.info('TEST CAMPAIGN METHOD::: Payload data')
      logger.info( 'Posted Campaign data is '+JSON.stringify(redactLogData(payload)));
      const apiClient = getApiClient(req);
      const url = `/phm/campaign/test-campaign/${user.organization_id}/${user.userId}`;
      logger.info('TEST CAMPAIGN METHOD::: URL '+url)
      return Promise.all([apiClient.post(url, payload)])
        .then(([response]) => {
          logger.info(response.data)
          let message = response.data.message;
          let alertType = response.data.alertType;
          if (alertType === 'error') {
            return res.status(ICONSTANTS.HTTP_BAD_REQUEST).json({message:'Campaign has failed', alertType:alertType})
          }else{
            return res.status(ICONSTANTS.HTTP_CREATED).json({message:'Campaign Send', alertType:alertType})
          }

        })
        .catch((error) => {
          logger.error('TEST CAMPAIGN METHOD::: ERROR')
          logger.error(`${error.message}`);
          logger.error(error);
          logger.error(error.stack);
          return res.status(ICONSTANTS.HTTP_BAD_REQUEST).json({message:'Error in Campaign Test', alertType:'error'})
        });
    
  } catch (error) {
    logger.error(error);  
    logger.error('TEST CAMPAIGN METHOD::: EXCEPTION')
    logger.error(error.stack);    
    return res.status(ICONSTANTS.HTTP_BAD_REQUEST).json({message:'Error in Campaign Send', alertType:'error'})

  }
};
