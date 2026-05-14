const REDACTED_EMAIL = "[REDACTED_EMAIL]";
const REDACTED_PASSWORD = "********";
const REDACTED_VALUE = "[REDACTED]";
const REDACTED_OBJECT = "[REDACTED_OBJ]";
const MAX_DEPTH = 6;

const SENSITIVE_KEYS = [
  "password",
  "pwd",
  "pass",
  "secret",
  "token",
  "api_key",
  "api_key_id",
  "apikey",
  "api_secret",
  "auth_token",
  "access_token",
  "refresh_token",
  "smtp_password",
  "smtp_account",
  "smtp_host",
  "smtp_port",
  "smtp_user",
  "smtp_pass",
  "credentials",
  "credential",
  "private_key",
  "private_key_id",
  "client_id",
  "client_email",
  "client_secret",
  "service_account",
  "service_account_email",
  "service_account_key",
  "authorization",
  "auth",
  "key",
  "sid",
  "account_sid",
  "email",
  "phone",
  "mobile",
  "contact",
  "address",
  "postal",
  "zip",
  "user_id",
  "user_ids",
  "domain_name",
  "verify_token",
  "session_token",
  "session_id",
  "sessionid",
  "jwt",
  "bearer",
  "pin",
  "otp",
  "params",
  "sender_email",
  "sender_id",
  "from_number",
  "sender_email_or_contact",
  "sender_display_name",
  "reply_to",
  "subject",
  "phishing_content",
  "landing_page_content",
  "smtp_data",
  "base_url",
  "host",
  "port",
  "envvariable"
];

const EMAIL_REGEX = /([A-Z0-9._%+-]+)@([A-Z0-9.-]+\.[A-Z]{2,})/gi;
const INLINE_KV_REGEX = /(password|pwd|pass|secret|token|api[_-]?key|api[_-]?secret|authorization|auth|session|sid|jwt|bearer|smtp_password|smtp_pass|smtp_user|auth_token|account_sid|sender_id|from_number|client_secret|private_key|app_sid|client_id|client_email)\s*[:=]\s*([^\s,;]+)/gi;
const INLINE_SESSION_ID_REGEX = /(session\s*id|session_id)\s*[:=]\s*([^\s,;]+)/gi;
const QUERY_PARAM_REGEX = /([?&])(password|pwd|pass|secret|token|api[_-]?key|api[_-]?secret|authorization|auth|session|sid|jwt|bearer|smtp_password|smtp_pass|smtp_user|auth_token|account_sid|sender_id|from_number|client_secret|private_key|app_sid|client_id|client_email)=([^&]+)/gi;

function toPlainObject(value) {
  if (!value || typeof value !== "object") return null;
  if (typeof value.toJSON === "function") {
    try {
      const json = value.toJSON();
      if (Object.prototype.toString.call(json) === "[object Object]") {
        return json;
      }
    } catch (e) {
      return null;
    }
  }
  return null;
}

function redactEmail(email) {
  try {
    if (!email || typeof email !== "string") return REDACTED_EMAIL;
    const parts = email.split("@");
    if (parts.length !== 2) return REDACTED_EMAIL;
    const local = parts[0];
    const domain = parts[1];
    if (!local || !domain) return REDACTED_EMAIL;

    const maskedLocal = local.length <= 1 ? "*" : `${local[0]}***`;
    const domainParts = domain.split(".");
    if (domainParts.length < 2) return `${maskedLocal}@[REDACTED_DOMAIN]`;
    const domainName = domainParts[0];
    const extension = domainParts.slice(1).join(".");
    const maskedDomain = domainName.length <= 1 ? "*" : `${domainName[0]}***`;
    return `${maskedLocal}@${maskedDomain}.${extension}`;
  } catch (e) {
    return REDACTED_EMAIL;
  }
}

function redactPassword(password) {
  if (password === undefined || password === null) return password;
  return REDACTED_PASSWORD;
}

function redactSessionId(sessionId) {
  if (sessionId === undefined || sessionId === null) return sessionId;
  if (typeof sessionId !== "string") return sessionId;
  return REDACTED_VALUE;
}

function redactString(value) {
  if (typeof value !== "string") return value;

  let redacted = value;
  redacted = redacted.replace(EMAIL_REGEX, (match) => redactEmail(match));
  redacted = redacted.replace(INLINE_KV_REGEX, (match, key) => `${key}=${REDACTED_VALUE}`);
  redacted = redacted.replace(INLINE_SESSION_ID_REGEX, (match, key) => `${key}=${REDACTED_VALUE}`);
  redacted = redacted.replace(QUERY_PARAM_REGEX, (match, prefix, key) => `${prefix}${key}=${REDACTED_VALUE}`);

  return redacted;
}

function redactLogData(value) {
  return redactValue(value, new WeakMap(), 0);
}

function redactValue(value, seen, depth) {
  if (depth > MAX_DEPTH) return "[MAX_DEPTH_REACHED]";
  if (value === null || value === undefined) return value;

  if (typeof value === "string") {
    return redactString(value);
  }

  if (typeof value !== "object") return value;
  if (seen.has(value)) return seen.get(value);

  const normalized = toPlainObject(value);
  if (normalized) {
    return redactValue(normalized, seen, depth + 1);
  }

  if (Array.isArray(value)) {
    const redactedArray = [];
    seen.set(value, redactedArray);
    value.forEach((item) => {
      redactedArray.push(redactValue(item, seen, depth + 1));
    });
    return redactedArray;
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: redactString(value.message),
      stack: redactString(value.stack || "")
    };
  }

  const isPlainObject = Object.prototype.toString.call(value) === "[object Object]";
  if (!isPlainObject) return value;

  const redactedObject = {};
  seen.set(value, redactedObject);
  Object.entries(value).forEach(([key, val]) => {
    const keyLower = String(key).toLowerCase();
    const isSensitive = SENSITIVE_KEYS.some((field) => keyLower.includes(field));

    if (isSensitive) {
      if (keyLower.includes("email") || keyLower === "smtp_account") {
        redactedObject[key] = redactEmail(val);
        return;
      }
      if (keyLower.includes("password")) {
        redactedObject[key] = redactPassword(val);
        return;
      }
      if (typeof val === "string") {
        const redacted = redactString(val);
        redactedObject[key] = redacted === val ? REDACTED_VALUE : redacted;
        return;
      }
      if (typeof val === "number") {
        redactedObject[key] = REDACTED_VALUE;
        return;
      }
      if (typeof val === "object") {
        redactedObject[key] = REDACTED_OBJECT;
        return;
      }
      redactedObject[key] = REDACTED_VALUE;
      return;
    }

    redactedObject[key] = redactValue(val, seen, depth + 1);
  });

  return redactedObject;
}

module.exports = {
  redactEmail,
  redactPassword,
  redactSessionId,
  redactString,
  redactLogData,
};
