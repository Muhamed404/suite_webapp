
const { logger } = require("../../../logger/logger");
const getApiClient = require('../../../utility/api-client')
const jwt = require('jsonwebtoken');


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
  const userToken = req.session?.mfaPendingUser?.userToken || null;
  // logger.info(`${logTxn} - Checking session jwtToken ${userToken}`);

  if (!userToken || userToken === null) {
    logger.warn(`${logTxn} - Missing Authorization header`);
    return res.status(401).json({ success: false, message: 'Missing Authorization header' });
  }

  // Decode token (without verifying yet) to get iss and sub
  const decoded = jwt.decode(userToken);
  // logger.info(`${logTxn} - Decoded JWT: ${JSON.stringify(decoded, null, 2)}`);
  if (!decoded || !decoded.iss || !decoded.sub) {
    return res.status(400).json({ success: false, message: 'Invalid JWT payload structure' });
  }
  const user = decoded.user ?? null;
  // console.log(`[Verify OTP]: Decoded JWT user: ${JSON.stringify(user, null, 2)}`);
  const url = '/mfa/verify-otp'
  const payload = {
    userId: user.userId,
    otp
  }
  logger.info(`[Verify OTP]: Sending OTP verification request to user: ${JSON.stringify(payload.userId)}`);
  const response = await apiClient.post(url, payload)
  const { object: verified } = response.data;
  logger.info(`[Verify OTP]: verified Response ${verified}`);

  if (!verified) {
    return res.render('pages/mfa/mfa-login', { layout: false, error: 'Invalid OTP', email: pendingUser.email });
  }

  // ✅ OTP valid → promote to full session
  req.session.jwtToken = userToken;

  // Clean up temp session
  delete req.session.mfaPendingUser;

  logger.info(`[MFA CONTROLLER] OTP validated. Session created for ${pendingUser.email}`);
  // return res.redirect('/phm/suite/management');
  return res.redirect("/home");

};