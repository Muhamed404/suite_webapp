const config = require("../../../config/env.config");

const { logger } = require("../../../logger/logger");
const ICONSTANTS = require("../../../contants/ICONSTANTS");
const getApiClient = require('../../../utility/api-client')


exports.testOrganizationSMTPConnection = (req, res) => {
  const apiClient = getApiClient(req);
  logger.info(`TEST SMTP CONNECTION::: REQUEST HAS RECEIVED`);
  
  const organizationId = req.params?.organizationId || null;
  if(!organizationId){
    logger.warn(`TEST SMTP CONNECTION::: ORGANIZATION ID IS MISSING or Null IN REQUEST`);
    return res.status(ICONSTANTS.HTTP_BAD_REQUEST).json({ success: false, message: 'Invalid Organization request' });
  }
  const url = `/settings/smtp/test-connection/${organizationId}`;
  logger.info(`TEST SMTP CONNECTION::: ${url}`);
  apiClient.get(url).then((response) => {
    let data = response.data;
    logger.info(`TEST SMTP CONNECTION: data is ${JSON.stringify(data)}`);
    // logger.info(`${JSON.stringify(data.message)}`);
    if (data.success) {
      return res.status(ICONSTANTS.HTTP_OK).json({success: true, message: data.message })

    }
    return res.status(ICONSTANTS.HTTP_BAD_REQUEST).json({ success: false, message: data.message })


  }).catch((error) => {
    logger.warn(`TEST SMTP CONNECTION::: CONNECTION FAILED`);
    //   let data = error.response.data
    logger.warn('TEST SMTP CONNECTION:::0 ' + error)
    logger.warn('TEST SMTP CONNECTION:::1 ' + error.stack)
    logger.warn('TEST SMTP CONNECTION:::2 ' + error.message)
    logger.warn('TEST SMTP CONNECTION:::3 ' + error.code)
    return res.status(ICONSTANTS.HTTP_BAD_REQUEST).json({ success: false, message: 'Connection Failed', alertType: 'error' });

  })
};