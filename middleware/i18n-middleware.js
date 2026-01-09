const i18n = require('i18n');
const path = require('path');

// Configure i18n
i18n.configure({
  objectNotation: true, // Enable nested keys
  locales: ['en', 'ar'],
  defaultLocale: 'en',
  cookie: 'lang',
  directory: path.join(__dirname, '../locales'),
  autoReload: true,
  syncFiles: false,
  queryParameter: 'lang',
});

console.log('✅ Available locales:', i18n.getLocales());

module.exports = i18n;

