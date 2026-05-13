
  
const { logger } = require("../../../logger/logger"); 
const { redactLogData, redactString } = require("../../../utility/redact");
const moment = require("moment");  
const getApiClient = require("../../../utility/api-client");

async function getPackagesByApplication(req, res) {
  try {
    logger.info("[Get Packages By Application]: GET: Incoming Params " + JSON.stringify(redactLogData(req.params)));
    const application_id = req.params?.selectedPackage || 0;
    const url = `/phm/commons/retrieve-packages-by-app/${application_id}`;

    const apiClient = getApiClient(req);
    const response = await apiClient.get(url)
    const { status, message, object: packages } = response.data;
    // console.log('@@@@@@@@@@@@@@@@@@@@@@22' + JSON.stringify(packages))
    return res.status(200).json({ packages });
  } catch (err) {
    logger.error("[Get Packages By Application]: GET:" + redactString(err && (err.message || String(err))));
    return res.status(500).json({
      error: "Failed to fetch packages",
      details: err.message || "Unknown error"
    });
  }
}

module.exports={
    getPackagesByApplication
}