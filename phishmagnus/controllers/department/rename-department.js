const config = require("../../../config/env.config");

const { logger } = require("../../../logger/logger");
const getApiClient = require('../../../utility/api-client')
const { redactLogData } = require("../../utility/redact");

exports.renameDepartment = async (req, res) => {
  logger.info('INCOMING RQUEST IN RENAME DEPARTMENT')
  const apiClient = getApiClient(req);
  try {
    let deptId = req.body.id;
    let deptName = req.body.name;
    let deptDesc = req.body.description === 'undefined' || req.body.description == null ? '' : req.body.description;
    let payload = {
      id: deptId,
      name: deptName,
      description: deptDesc
    }
    logger.info('Rename dept payload ' + JSON.stringify(redactLogData(payload)))
    let orgId = req.user.organization_id;
    const url = `/department/rename/${orgId}`;
    logger.info('RENAME DEPARTMENT METHOD ::: PRINTING URL ' + url)
    const response = await apiClient.post(url, payload);
    logger.info('RENAME DEPARTMENT METHOD ::: PRINTING RESPONSE ' + JSON.stringify(redactLogData(response.data)))
    let message = response.data;
    return res.status(message.status).json({ message: 'Record has been renamed', alertType: 'success' });


  } catch (error) {
    logger.error(`error in renaming department. \n ${error}`);
    return res.status(400).json({ error: 'Error in renaming.' })
  }
};
