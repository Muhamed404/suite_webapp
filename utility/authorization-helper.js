const { logger } = require("../logger/logger");
const enums = require("../contants/enum");
const { redactLogData } = require("./redact");

function getUserInfo(req) {
  const user = req.user;
  const orgId = user?.organization_id;
  return {
    userId: user?.userId || user?.id,
    email: user?.email,
    orgId: orgId,
    organizationId: orgId,
    permissions: user?.permissions || [],
    roleId: user?.role?.id,
    fullUser: user
  };
}

function isMagnusAdmin(roleId) {
  return roleId === enums.userType.MagSuperAdmin || 
         roleId === enums.userType.MagSubAdmin;
}


function isMagnusAdminByOrg(userOrgId) {
  return userOrgId === null || userOrgId === undefined;
}


function hasModulePermission(permissions, moduleName, accessTypes, caseInsensitive = false) {
  return permissions.some(perm => {
    const moduleMatch = caseInsensitive 
      ? perm.module?.toLowerCase() === moduleName?.toLowerCase()
      : perm.module === moduleName;
    
    const accessMatch = caseInsensitive
      ? accessTypes.some(type => perm.name?.toLowerCase() === type?.toLowerCase())
      : accessTypes.includes(perm.name);
    
    return moduleMatch && accessMatch;
  });
}

function hasGlobalPermission(permissions, moduleName, caseInsensitive = false) {
  const globalAccessTypes = [
    enums.Access_Types.RWD_ALL,
    enums.Access_Types.RW_ALL,
    enums.Access_Types.R_ALL
  ];
  return hasModulePermission(permissions, moduleName, globalAccessTypes, caseInsensitive);
}

function hasOrgLevelPermission(permissions, moduleName, caseInsensitive = false) {
  const orgAccessTypes = [
    enums.Access_Types.RWD_O,
    enums.Access_Types.RW_O,
    enums.Access_Types.R_O
  ];
  return hasModulePermission(permissions, moduleName, orgAccessTypes, caseInsensitive);
}

function canAccessOrganization(userInfo, targetOrgId, moduleName, caseInsensitive = false) {
  const { orgId: userOrgId, permissions, roleId } = userInfo;
  
  if (isMagnusAdmin(roleId) || isMagnusAdminByOrg(userOrgId)) {
    return { allowed: true, reason: 'Magnus Admin' };
  }
  
  if (hasGlobalPermission(permissions, moduleName, caseInsensitive)) {
    return { allowed: true, reason: 'Global Permission' };
  }
  
  if (hasOrgLevelPermission(permissions, moduleName, caseInsensitive)) {
    if (userOrgId === parseInt(targetOrgId)) {
      return { allowed: true, reason: 'Own Organization Permission' };
    }
    return { allowed: false, reason: 'Can only access own organization' };
  }
  
  return { allowed: false, reason: 'No permission' };
}

function canAccessUser(userInfo, targetUserId, moduleName) {
  const { userId, permissions, roleId } = userInfo;
  
  if (userId === parseInt(targetUserId)) {
    return { allowed: true, reason: 'Own profile' };
  }
  
  if (isMagnusAdmin(roleId)) {
    return { allowed: true, reason: 'Magnus Admin' };
  }
  
  if (hasGlobalPermission(permissions, moduleName)) {
    return { allowed: true, reason: 'Global Permission' };
  }
  
  return { allowed: false, reason: 'No permission' };
}

function canAccessUserInOrg(userInfo, targetUserId, targetUserOrgId, moduleName) {
  const { userId, orgId: userOrgId, permissions, roleId } = userInfo;
  
  if (userId === parseInt(targetUserId)) {
    return { allowed: true, reason: 'Own profile' };
  }
  
  if (isMagnusAdmin(roleId)) {
    return { allowed: true, reason: 'Magnus Admin' };
  }
  
  if (hasGlobalPermission(permissions, moduleName)) {
    return { allowed: true, reason: 'Global Permission' };
  }
  
  if (hasOrgLevelPermission(permissions, moduleName)) {
    if (userOrgId === parseInt(targetUserOrgId)) {
      return { allowed: true, reason: 'Same organization permission' };
    }
    return { allowed: false, reason: 'Can only access users in own organization' };
  }
  
  return { allowed: false, reason: 'No permission' };
}

function canAccessCampaign(userInfo, campaignOrgId, moduleName = 'Campaign_Reports') {
  const { orgId: userOrgId, permissions, roleId } = userInfo;
  
  if (isMagnusAdmin(roleId) || isMagnusAdminByOrg(userOrgId)) {
    return { allowed: true, reason: 'Magnus Admin' };
  }
  
  if (hasGlobalPermission(permissions, moduleName)) {
    return { allowed: true, reason: 'Global Permission' };
  }
  
  if (hasOrgLevelPermission(permissions, moduleName)) {
    if (userOrgId === parseInt(campaignOrgId)) {
      return { allowed: true, reason: 'Own Organization Campaign' };
    }
    return { allowed: false, reason: 'Can only access campaigns from own organization' };
  }
  
  return { allowed: false, reason: 'No permission to access campaigns' };
}

function logAuthResult(action, userInfo, authResult, resourceId = '') {
  const { email, userId, orgId } = userInfo;
  const logMsg = `[Authorization] ${redactLogData(action)} - User: ${redactLogData(email)} (ID: ${redactLogData(userId)}, Org: ${redactLogData(orgId)}) - Resource: ${redactLogData(resourceId)} - Result: ${authResult.allowed ? 'ALLOWED' : 'DENIED'} - Reason: ${redactLogData(authResult.reason)}`;
  
  if (authResult.allowed) {
    logger.info(logMsg);
  } else {
    logger.warn(logMsg);
  }
}

module.exports = {
  getUserInfo,
  isMagnusAdmin,
  isMagnusAdminByOrg,
  hasModulePermission,
  hasGlobalPermission,
  hasOrgLevelPermission,
  canAccessOrganization,
  canAccessUser,
  canAccessUserInOrg,
  canAccessCampaign,
  logAuthResult
};
