
const { logger } = require("../../../logger/logger");
const getApiClient = require('../../../utility/api-client')


exports.verifyOTP = async (req, res) => {
  logger.info(`[Verify OTP]: Incoming request with body values ${JSON.stringify(req.body)}`);
  const { otp } = req.body;

  if (!req.session.mfaPendingUser) {
    logger.warn(`[Verify OTP]: Invalid mfaPending user session. reroute to login page`);

    return res.redirect('/phm/login');
  }

  const pendingUser = req.session.mfaPendingUser;

  // ✅ Call your MFA microservice here to verify OTP
  const apiClient = getApiClient(req);
  const url = '/mfa/verify-otp'
  const payload = {
    userId: req.session.mfaPendingUser.id,
    otp
  }
  const response = await apiClient.post(url, payload)
  const { object: verified } = response.data;
  logger.info(`[Verify OTP]: verified Response ${verified}`);

  if (!verified) {
    return res.render('pages/mfa/mfa-login', { error: 'Invalid OTP', email: pendingUser.email });
  }

  // ✅ OTP valid → promote to full session
  req.user = pendingUser.user;
  req.user.role = { id: pendingUser.roleId };
  req.session.jwtToken = pendingUser.jwtToken;
  req.session.permissions = pendingUser.permissions;
  req.session.locals_awm_subscription = pendingUser.hasUserAWMSubscription;
  req.session.locals_phm_subscription = pendingUser.hasUserPHMSubscription;

  // Clean up temp session
  delete req.session.mfaPendingUser;

  logger.info(`[MFA CONTROLLER] OTP validated. Session created for ${pendingUser.email}`);
  return res.redirect('/phm/suite/management');
};