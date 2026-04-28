const { logger } = require("../logger/logger");
const enums = require('../contants/enum');

function setGlobalUserVariables(req, res, next) {
  // logger.info('VARIABLES GLOBALLY MIDDLEWARE CALLING::::')

  if (req.user) {
    // logger.info('user session printing in global variable: ' + JSON.stringify(req.user, null, 2))

    res.locals.username = req.user.first_name + ' ' + req.user.last_name;
    res.locals.email = req.user.email;

    /* disable options for magnus admin and sub magnus admin 
    */
    const roleId = req?.user?.role?.id || 0;
    if (Number(roleId) === Number(enums.userType.MagSuperAdmin) || Number(roleId) === Number(enums.userType.MagSubAdmin)) {
      res.locals.magnusAdmin = true;
    } else {
      res.locals.magnusAdmin = false
    }
    res.locals.isSubAdmin = Number(roleId) === Number(enums.userType.MagSubAdmin);

    logger.info(`User ${req.user.email} has permission for phm ${req.user?.phm_license || false} and awm ${req.user?.awm_license || false}`);
    res.locals.locals_phm_subscription = req.user?.phm_license || false;
    res.locals.locals_awm_subscription = req.user?.awm_license || false;

  }

  return next();
}




module.exports = setGlobalUserVariables;
