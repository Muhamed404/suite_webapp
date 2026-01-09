 

const { logger } = require("../../../logger/logger");
 
const MFAService = require('../../services/mfa/mfa-service')

exports.createSMTP = async (req, res) => {
  try {
    logger.info(`[Save MFA SMTP]: Incoming request with the form submit values ${JSON.stringify(req.body)}`);
    const { name, smtp_host, smtp_port, smtp_user, smtp_pass, smtp_secure, mfa } = req.body;
    const enable_mfa = mfa === 'true' ? true : false;
    const smtpData = {
      smtp_host,
      smtp_port,
      smtp_user,
      smtp_pass,
      smtp_secure: smtp_secure === 'true' ? true : false
    };

    await MFAService.create(req, name, smtpData, enable_mfa);

    logger.info(`[Save MFA SMTP]: Redirecting Render`);

    res.redirect('/mfa/settings?message=Connection has been saved&alertType=success&alertSwal=true');
  } catch (error) {
    logger.error('Create MFA SMTP error:', error);
    res.redirect('/mfa/settings?message=Issue in saving smtp&alertType=error&alertSwal=true');

  }
};