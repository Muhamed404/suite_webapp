const path = require('path');
const dotenvFlow = require('dotenv-flow');

dotenvFlow.config({
  path: path.resolve(__dirname, '../'),
  pattern: '.env'
});

const REQUIRED_ENV_VARS = [
  'WEB_TEMPLATE_BUCKET',
  'AWAREMAGNUS_DASHBOARD_URL',
  'BACKEND_SUITE_PUBLIC_KEY_PATH',
  'BACKEND_TVBS_URL',
  'SECURE_MAGNUS_WORKSPACE',
  'REDIS_URL',
  'BACKEND_EP',
  'REDIS_SERVER_IP',
  'REDIS_SERVER_PORT',
  'COOKIE_JWT_TOKEN_EXPIRY',
  'LOGS_DIR',
  'LOGS_FILENAME'
];

function validateEnv() {
  const missing = REQUIRED_ENV_VARS.filter((key) => {
    const value = process.env[key];
    return !value || !String(value).trim();
  });

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach((key) => console.error(`   - ${key}`));
    console.error('Frontend will not start until all required variables are set.');
    process.exit(1);
  }
}

module.exports = { validateEnv };

