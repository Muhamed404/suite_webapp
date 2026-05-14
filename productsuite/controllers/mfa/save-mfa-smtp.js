

const { logger } = require("../../../logger/logger");
const { redactLogData } = require("../../../phishmagnus/utility/redact");

const MFAService = require('../../services/mfa/mfa-service')

exports.createSMTP = async (req, res) => {
  try {
    logger.info(`[Save MFA SMTP]: Incoming request for connection: ${JSON.stringify(redactLogData(req.body), null, 2)}`);
    const { name, smtp_host, smtp_port, smtp_user, smtp_pass, enable_mfa, is_encrypted } = req.body;

    const smtpData = {
      smtp_host,
      smtp_port: parseInt(smtp_port, 10),
      smtp_user,
      smtp_pass
    };

    await MFAService.create(req, name, smtpData, enable_mfa, is_encrypted);

    logger.info(`[Save MFA SMTP]: Configuration saved successfully`);

    res.redirect(`/mfa/settings?message=${encodeURIComponent('Connection has been saved')}&alertType=success&alertSwal=true`);
  } catch (error) {
    logger.error('[Save MFA SMTP]: Create MFA SMTP error:', error);
    const errMsg = error.response?.data?.message || 'Issue in saving SMTP configuration';
    res.redirect(`/mfa/settings?message=${encodeURIComponent(errMsg)}&alertType=error&alertSwal=true`);
  }
};