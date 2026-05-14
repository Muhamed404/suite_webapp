const { logger } = require("../../../logger/logger");


const getApiClient = require("../../../utility/api-client");
const { redactLogData } = require("../../../utility/redact");

async function retrieveSubscribedServices(req, res) {
  try {
    logger.info("[Retrieve Subscribed Services]: GET: Incoming Params " + JSON.stringify(redactLogData(req.params)));
    const subscriptionId = req.params?.subscriptionId || 0;
    if (subscriptionId === 0) {
      return res.status(200).json({ services: [] });
    }
    const url = `/app_service/show-services/${subscriptionId}`;

    const apiClient = getApiClient(req);
    const response = await apiClient.get(url)
    // console.log(response.data)
    const { object: services } = response.data;
    logger.info('[Retrieve Subscribed Services]: GET: ' + JSON.stringify(redactLogData(services)))
    return res.status(200).json({ services });
  } catch (err) {
    logger.error("[Retrieve Subscribed Services]: GET:" + redactLogData(err));
    return res.status(500).json({
      error: "Failed to fetch service cost",
      details: err.message || "Unknown error"
    });
  }
}



async function retrieveApplicationServicesByApplication(req, res) {
  try {
    logger.info(`[Get Services By Application]: GET: Incoming Params: ${JSON.stringify(redactLogData(req.params))}`);

    const app_id = req.params?.application_id || 0;
    logger.info(`[Get Services By Application]: Using application_id: ${app_id}`);

    const url = `/app_service/retrieve-services/${app_id}`;
    logger.info(`[Get Services By Application]: Requesting URL: ${redactLogData(url)}`);

    const apiClient = getApiClient(req);
    const response = await apiClient.get(url);

    logger.info(`[Get Services By Application]: API Response Status: ${response.status}`);
    logger.debug(`[Get Services By Application]: API Response Data: ${JSON.stringify(redactLogData(response.data))}`);

    const { status, message, object: services } = response.data;
    logger.info(`[Get Services By Application]: Extracted services: ${JSON.stringify(redactLogData(services), null, 2)}`);

    return res.status(200).json({ services });
  } catch (err) {
    logger.error(`[Get Services By Application]: GET: Error: ${redactLogData(err && err.stack ? err.stack : err)}`);
    return res.status(500).json({
      error: "Failed to fetch services",
      details: err.message || "Unknown error"
    });
  }
}


async function calculateApplicationServiceCost(req, res) {
  try {
    logger.info("[Calculate Service]: POST: Incoming Body " + JSON.stringify(redactLogData(req.body)));
    const { serviceIds } = req.body;
    if (!Array.isArray(serviceIds) || serviceIds.length === 0) {
      return res.status(400).json({ error: 'No service IDs provided' });
    }
    const url = `/app_service/calculate-service-cost`;

    const apiClient = getApiClient(req);
    const response = await apiClient.post(url, {
      serviceIds
    })
    const { object: cost } = response.data;

    return res.status(200).json({ cost });
  } catch (err) {
    logger.error("[Calculate Service]: POST:" + redactLogData(err));
    return res.status(500).json({
      error: "Failed to fetch service cost",
      details: err.message || "Unknown error"
    });
  }
}
module.exports = {
  retrieveSubscribedServices,
  retrieveApplicationServicesByApplication,
  calculateApplicationServiceCost
}