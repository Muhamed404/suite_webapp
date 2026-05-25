 
const { logger } = require("../../../logger/logger");
const { redactLogData, redactString } = require("../../../utility/redact");
 
const getApiClient = require("../../../utility/api-client");

async function calculatePackageCost(req, res) {
  try {
    logger.info("[Retrieve Package Cost]: GET: Incoming Params " + JSON.stringify(redactLogData(req.params)));
    const packageId = req.params?.packageId || 0;
    if (packageId === 0) {
      return res.status(200).json({ cost: 0 });
    }
    const url = `/phm/commons/retrieve-package-cost/${packageId}`;

    const apiClient = getApiClient(req);
    const response = await apiClient.get(url)
    const { object: cost } = response.data;
    return res.status(200).json({ cost });
  } catch (err) {
    logger.error("[Retrieve Package Cost]: GET:" + redactString(err && (err.message || String(err))));
    return res.status(500).json({
      error: "Failed to fetch service cost",
      details: err.message || "Unknown error"
    });
  }
}


module.exports={
    calculatePackageCost
}