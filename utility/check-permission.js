const { logger } = require("../logger/logger");
const { redactLogData } = require("./redact");


const checkPermission = (moduleName, allowedAccessTypes = []) => {
  return async (req, res, next) => {
    try {
      logger.info(`[CHECK PERMISSION] Module_Name: ${redactLogData(moduleName)}, AllowedAccessTypes: ${JSON.stringify(redactLogData(allowedAccessTypes))}`);

      const userPermissions = req?.permissions || [];

      if (!Array.isArray(userPermissions) || userPermissions.length === 0) {
        logger.warn('[CHECK PERMISSION] No permissions found in session.');
        return res.status(403).json({ message: 'Access denied: No permissions assigned' });
      }

      // logger.info('[CHECK PERMISSION] List of Assigned Permissions: ' + JSON.stringify(userPermissions));

      // Normalize for case-insensitive comparison
      const normalizedModule = moduleName?.toLowerCase();
      const normalizedAllowedTypes = allowedAccessTypes.map(type => type?.toLowerCase());

      const hasAccess = userPermissions.some(perm =>
        perm?.module?.toLowerCase() === normalizedModule &&
        normalizedAllowedTypes.includes(perm?.name?.toLowerCase())
      );

      logger.info(`[CHECK PERMISSION] Access: ${hasAccess ? 'Granted ✅' : 'Denied ❌'}`);

      if (!hasAccess) {
        req.flash("message", "Access denied: Insufficient permission");
        req.flash("alertType", "error");
        return res.redirect('/home');
        // return res.status(403).json({ message: 'Access denied: Insufficient permission' });
      }

      next();
    } catch (error) {
      logger.error('[CHECK PERMISSION] ' + redactLogData(error));
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  };
};

module.exports = checkPermission;


