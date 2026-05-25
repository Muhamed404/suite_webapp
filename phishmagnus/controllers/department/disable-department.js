const config = require("../../../config/env.config");

const { logger } = require("../../../logger/logger");
const ICONSTANTS = require('../../../contants/ICONSTANTS')
const getApiClient = require('../../../utility/api-client')
const { redactLogData } = require("../../utility/redact");

exports.disableDepartment = async (req, res) => {
  logger.info('INCOMING RQUEST IN DISABLE DEPARTMENT')
  const apiClient = getApiClient(req);
  try {
    let deptId = req.body.id;
    let deptName = req.body.name;
    let payload = {
      id: deptId,
      name: deptName
    }

    logger.info('INCOMING PAYLOAD ' + JSON.stringify(redactLogData(payload)))
    let orgId = req.params.orgId;
    const url = `/department/disable/${orgId}`;
    logger.info('INCOMING url ' + url)

    await apiClient.post(url, payload);

    return res.status(ICONSTANTS.HTTP_OK).json({ message: 'Record has been updated', alertType: 'success' });

  } catch (error) {
    logger.error(`error in removing department. \n ${error}`);
    //return res.status(400).json({error:'Error in removing.'}) 
    return res.status(ICONSTANTS.HTTP_BAD_REQUEST).json({ message: 'Issue in updating', alertType: 'error' });
  }
};

