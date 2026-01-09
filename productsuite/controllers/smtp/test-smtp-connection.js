const config = require("../../../config/env.config");

const { logger } = require("../../../logger/logger");
const ICONSTANTS = require("../../../contants/ICONSTANTS");
const getApiClient = require('../../../utility/api-client')


exports.testSMTPConnection = (req, res) => {
  const apiClient = getApiClient(req);
  logger.info(`TEST SMTP CONNECTION::: REQUEST HAS RECEIVED`);
  let orgId = req.query.organization;
  let url = `/settings/smtp/test-connection?organization=${orgId}`;
  logger.info(`TEST SMTP CONNECTION::: ${url}`);
  apiClient.get(url).then((response) => {
    let data = response.data;
    logger.info(`data is ${JSON.stringify(data)}`);
    logger.info(`${JSON.stringify(data.message)}`);
    if (data.alertType === 'success') {
      url = `/settings/smtp/test-connection?organization=${orgId}`;
    }
    
    return res.status(ICONSTANTS.HTTP_OK).json({ message: data})

  }).catch((error) => {
    logger.warn(`TEST SMTP CONNECTION::: CONNECTION FAILED`);
 //   let data = error.response.data
 logger.warn('TEST SMTP CONNECTION:::0 ' + error)
    logger.warn('TEST SMTP CONNECTION:::1 ' + error.stack)
    logger.warn('TEST SMTP CONNECTION:::2 ' + error.message)
    logger.warn('TEST SMTP CONNECTION:::3 ' + error.code)
    return res.status(ICONSTANTS.HTTP_BAD_REQUEST).json({message: 'Connection Failed',alertType:'error'});

  })
};