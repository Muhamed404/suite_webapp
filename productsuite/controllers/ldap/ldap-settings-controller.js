const { logger } = require("../../../logger/logger");
const getApiClient = require("../../../utility/api-client");

function resolveOrgId(req) {
  const orgId = Number(req.params.orgId || req.user?.organization_id || 0);
  if (!Number.isFinite(orgId) || orgId <= 0) {
    throw new Error("Invalid organization id.");
  }
  return orgId;
}

function toBool(value, fallback = false) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  if (typeof value === "boolean") {
    return value;
  }

  return ["true", "1", "yes", "on"].includes(String(value).toLowerCase());
}

function normalizeTransportSecurity(value) {
  const normalized = String(value || "NONE").trim().toUpperCase();
  if (["NONE", "LDAPS", "STARTTLS"].includes(normalized)) {
    return normalized;
  }

  return "NONE";
}

async function renderLdapPage(req, res) {
  let orgId = 0;

  try {
    orgId = resolveOrgId(req);
    const flashMessages = req.flash("message");
    const flashAlertTypes = req.flash("alertType");
    const apiClient = getApiClient(req);

    const [profileResponse, configResponse, statusResponse] = await Promise.all([
      apiClient.get(`/organization/profile/${orgId}`),
      apiClient.get(`/org/${orgId}/ldap/config`),
      apiClient.get(`/org/${orgId}/ldap/status`),
    ]);

    const profile = profileResponse.data?.message || {};
    const ldapConfig = configResponse.data?.message || {};
    const syncStatus = statusResponse.data?.message || {};

    return res.render("pages/settings/ldap/create-ldap", {
      enableSuiteManagementLeftMenu: true,
      org: orgId,
      organizationName: profile.name || "Organization",
      ldapConfig,
      syncStatus,
      flashMessage: flashMessages && flashMessages.length ? flashMessages[0] : "",
      flashAlertType: flashAlertTypes && flashAlertTypes.length ? flashAlertTypes[0] : "",
    });
  } catch (error) {
    logger.error(`[LDAP Settings][GET] ${error.message}`);
    req.flash("message", "Unable to load LDAP settings.");
    req.flash("alertType", "error");
    return res.redirect(orgId ? `/organization/profile/${orgId}` : "/organization/");
  }
}

async function saveLdapConfig(req, res) {
  let orgId = 0;

  try {
    orgId = resolveOrgId(req);

    const payload = {
      host: req.body.host,
      port: Number(req.body.port),
      base_dn: req.body.base_dn,
      users_base_dn: req.body.users_base_dn,
      groups_base_dn: req.body.groups_base_dn,
      departments_base_dn: req.body.departments_base_dn,
      bind_dn: req.body.bind_dn,
      bind_password: req.body.bind_password,
      transportSecurity: normalizeTransportSecurity(req.body.transportSecurity),
      reject_unauthorized: toBool(req.body.reject_unauthorized, true),
      allow_domain_root_query: toBool(req.body.allow_domain_root_query, false),
      auto_sync_enabled: toBool(req.body.auto_sync_enabled, false),
      sync_interval_minutes: Number(req.body.sync_interval_minutes || 60),
      incremental_sync_enabled: toBool(req.body.incremental_sync_enabled, false),
      user_filter: req.body.user_filter,
      group_filter: req.body.group_filter,
      department_filter: req.body.department_filter,
      ca_cert: req.body.ca_cert,
      page_size: Number(req.body.page_size || 500),
    };

    const apiClient = getApiClient(req);
    const response = await apiClient.post(`/org/${orgId}/ldap/config`, payload);

    req.flash("message", response.data?.message || "LDAP configuration saved.");
    req.flash("alertType", "success");
    return res.redirect(`/settings/ldap/${orgId}`);
  } catch (error) {
    const message = error?.response?.data?.message || error.message || "Unable to save LDAP settings.";
    logger.error(`[LDAP Settings][POST] ${message}`);
    req.flash("message", Array.isArray(message) ? message.join(", ") : message);
    req.flash("alertType", "error");
    return res.redirect(orgId ? `/settings/ldap/${orgId}` : "/organization/");
  }
}

async function triggerManualSync(req, res) {
  let orgId = 0;

  try {
    orgId = resolveOrgId(req);
    const apiClient = getApiClient(req);
    const response = await apiClient.post(`/org/${orgId}/ldap/sync`, {});

    req.flash("message", response.data?.message || "LDAP sync completed.");
    req.flash("alertType", "success");
    return res.redirect(`/settings/ldap/${orgId}`);
  } catch (error) {
    const message = error?.response?.data?.message || error.message || "LDAP sync failed.";
    logger.error(`[LDAP Settings][SYNC] ${message}`);
    req.flash("message", Array.isArray(message) ? message.join(", ") : message);
    req.flash("alertType", "error");
    return res.redirect(orgId ? `/settings/ldap/${orgId}` : "/organization/");
  }
}

module.exports = {
  renderLdapPage,
  saveLdapConfig,
  triggerManualSync,
};