// Use dotenv-flow for advanced .env management (like backend)
const fs = require('fs');
const path = require('path');
const dotenvFlow = require('dotenv-flow');

dotenvFlow.config({
  path: path.resolve(__dirname, '../'),
  pattern: '.env'
});

const readKeyFile = (filePath, name) => {
  if (!filePath) {
    throw new Error(`${name} path is not defined`);
  }

  const resolvedPath = path.resolve(filePath);

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`${name} file not found at ${resolvedPath}`);
  }

  return fs.readFileSync(resolvedPath, 'utf8');
};


console.log('Frontend loaded environment for NODE_ENV:', process.env.NODE_ENV);
module.exports = {
  LOGS_DIR: process.env.LOGS_DIR,
  LOGS_FILENAME: process.env.LOGS_FILENAME,
  NODE_ENV: process.env.NODE_ENV,
  HOST: process.env.HOST,
  PORT: process.env.PORT,
  COOKIE_JWT_TOKEN_EXPIRY: process.env.COOKIE_JWT_TOKEN_EXPIRY ? process.env.COOKIE_JWT_TOKEN_EXPIRY.trim() : 0,
  BACKEND_EP: process.env.BACKEND_EP,
  REDIS_SERVER_IP: process.env.REDIS_SERVER_IP,
  REDIS_SERVER_PORT: process.env.REDIS_SERVER_PORT,
  REDIS_SESSION_SECRET_KEY: process.env.REDIS_SESSION_SECRET_KEY,
  SECURE_MAGNUS_WORKSPACE: process.env.SECURE_MAGNUS_WORKSPACE,
  REDIS_URL: process.env.REDIS_URL,

  BACKEND_SUITE_PUBLIC_KEY: readKeyFile(
    process.env.BACKEND_SUITE_PUBLIC_KEY_PATH,
    'BACKEND_SUITE_PUBLIC_KEY'
  ),

  // SECURE_MAGNUS_DIRCTORY: process.env.SECURE_MAGNUS_DIRCTORY,
  // SECURE_MAGNUS_WORKSPACE: process.env.SECURE_MAGNUS_WORKSPACE,
  // POSTERS_LIBRARY_DEFAULT_FOLDER: process.env.POSTERS_LIBRARY_DEFAULT_FOLDER,
  // USERS_UPLOAD_FOLDER: process.env.USERS_UPLOAD_FOLDER,
  // SMTP_TEST_API: process.env.SMTP_TEST_API,
  // TEST_CAMPAIGN_API: process.env.TEST_CAMPAIGN_API,
  // INSTANT_CAMPAIGN_LAUNCH: process.env.INSTANT_CAMPAIGN_LAUNCH,

  BACKEND_TVBS_URL: process.env.BACKEND_TVBS_URL,

  /** Base URL of the Aware Magnus dashboard app (e.g. https://awm.example.com). Used for "View Dashboard" redirect with token. */
  AWAREMAGNUS_DASHBOARD_URL: process.env.AWAREMAGNUS_DASHBOARD_URL
    ? process.env.AWAREMAGNUS_DASHBOARD_URL.replace(/\/$/, '')
    : '',
};
