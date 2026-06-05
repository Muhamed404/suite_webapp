const { logger } = require("../../../logger/logger");
const ICONSTANTS = require("../../../contants/ICONSTANTS");
const getApiClient = require("../../../utility/api-client");
const { redactString } = require("../../../utility/redact");
const backend_api_urls = require("../../../config/backend_api_urls");
const enums = require("../../../contants/enum");

function resolveOrganizationId(req) {
  const requestedOrgId = Number(req.params.organizationId || req.body?.organizationId || 0);
  const userOrgId = req.user?.organization_id ? Number(req.user.organization_id) : 0;
  const roleId = Number(req.user?.role?.id || req.user?.role_id || 0);
  const isMagAdmin =
    roleId === enums.userType.MagSuperAdmin || roleId === enums.userType.MagSubAdmin;

  if (!Number.isFinite(requestedOrgId) || requestedOrgId <= 0) {
    if (userOrgId > 0) {
      return userOrgId;
    }
    throw new Error("Invalid organization id.");
  }

  if (!isMagAdmin && userOrgId && userOrgId !== requestedOrgId) {
    const error = new Error("Unauthorized organization access.");
    error.statusCode = 403;
    throw error;
  }

  return requestedOrgId;
}

function resolveImportMode(body) {
  const rawMode = String(body?.import_mode || body?.mode || body?.ldap_integration_mode || "")
    .trim()
    .toUpperCase();

  if (rawMode === "ONLY_IMPORT") {
    return "SYNC_ONLY";
  }

  if (rawMode === "IMPORT_AND_LOGIN") {
    return "FULL_LDAP_AUTH";
  }

  if (rawMode === "SYNC_ONLY" || rawMode === "FULL_LDAP_AUTH") {
    return rawMode;
  }

  return "";
}

function extractErrorMessage(error, fallbackMessage) {
  const responseData = error?.response?.data || {};
  const messagePayload = responseData.message;
  const message = Array.isArray(messagePayload)
    ? messagePayload.join(", ")
    : typeof messagePayload === "string" && messagePayload.trim().length > 0
      ? messagePayload
      : error?.message || fallbackMessage;

  return {
    message,
  };
}

async function importLdapUsers(req, res) {
  try {
    const organizationId = resolveOrganizationId(req);
    const importMode = resolveImportMode(req.body || {});

    if (!importMode) {
      return res.status(ICONSTANTS.HTTP_BAD_REQUEST).json({
        success: false,
        message: "LDAP import mode is required.",
      });
    }

    const apiClient = getApiClient(req);
    const response = await apiClient.post(
      backend_api_urls.PRODUCT_SUITE.User_Management.LDAP_IMPORT(organizationId),
      {
        import_mode: importMode,
        selectedProductKey: Number(req.body?.selectedProductKey || req.body?.application || req.body?.productKey || 0) || null,
      }
    );

    const message = response.data?.message || "LDAP import completed.";
    const data = response.data?.object || response.data?.data || null;

    return res.status(ICONSTANTS.HTTP_OK).json({
      success: true,
      message,
      data,
    });
  } catch (error) {
    const details = extractErrorMessage(error, "LDAP import failed.");
    logger.error(`[LDAP Import][UI] ${redactString(details.message || "")}`);
    const statusCode = error?.response?.status || ICONSTANTS.HTTP_BAD_REQUEST;

    return res.status(statusCode).json({
      success: false,
      message: details.message || "LDAP import failed.",
    });
  }
}

module.exports = {
  importLdapUsers,
};
