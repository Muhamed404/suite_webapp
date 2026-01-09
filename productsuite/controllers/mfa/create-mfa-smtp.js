 
const { logger } = require("../../../logger/logger");
 
const MFAService = require('../../services/mfa/mfa-service')

exports.renderCreateForm = async (req, res) => {
  logger.info(`[MFA SMTP]: Incoming request`);
  if (req.method === "GET") {
    const mfaSMTP = await MFAService.retrieveMFAConfiguration(req);

    logger.info(`[MFA SMTP]: Printing response ${JSON.stringify(mfaSMTP)}`);

    return res.render("pages/mfa/create", {
      smtpData: mfaSMTP
    });
  }
};