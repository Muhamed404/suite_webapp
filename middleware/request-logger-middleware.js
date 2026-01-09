const { logger } = require('../logger/logger');


module.exports = (req, res, next) => {
  if (/\.(css|js|png|jpg|jpeg|svg|ico|com)$/.test(req.url)) {
    return next(); // skip logging for these
  }
  let ip = req.ip;
  // const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  logger.info(`INCOMING IP ${ip} , SERVER INCOMING REQ :: ${req.method}, ${req.url}`);
  next();
};

