#!/usr/bin/env node
/**
 * Generate RSA key pair for BACKEND_SUITE (JWT verification).
 * Writes public.pem and private.pem to suite_webapp/keys/
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const keysDir = path.resolve(__dirname, '../keys');
if (!fs.existsSync(keysDir)) {
  fs.mkdirSync(keysDir, { recursive: true });
}

const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

const publicPath = path.join(keysDir, 'public.pem');
const privatePath = path.join(keysDir, 'private.pem');

fs.writeFileSync(publicPath, publicKey, 'utf8');
fs.writeFileSync(privatePath, privateKey, 'utf8');

console.log('Generated RSA key pair:');
console.log('  Public:  ', publicPath);
console.log('  Private: ', privatePath);
console.log('\nSet in suite_webapp/.env:');
console.log('  BACKEND_SUITE_PUBLIC_KEY_PATH=' + publicPath.replace(/\//g, path.sep));
console.log('\nSet in service_suite/.env (required for login/JWT signing):');
console.log('  BACKEND_SUITE_PUBLIC_KEY_PATH=' + publicPath.replace(/\//g, path.sep));
console.log('  BACKEND_SUITE_PRIVATE_KEY_PATH=' + privatePath.replace(/\//g, path.sep));
