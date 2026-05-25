// config/env.js
// Centralized environment/config validation
const required = [
  'ADMIN_USER',
  'ADMIN_PASS',
  'SESSION_SECRET'
];

function getConfig() {
  if (!process.env.SESSION_SECRET) process.env.SESSION_SECRET = 'fallback_session_secret_for_dev';
  if (!process.env.ADMIN_USER) process.env.ADMIN_USER = 'admin';
  if (!process.env.ADMIN_PASS) process.env.ADMIN_PASS = 'admin';

  const missing = required.filter(k => !process.env[k]);
  if (missing.length) {
    throw new Error('Missing required env vars: ' + missing.join(', '));
  }
  return {
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    sessionSecret: process.env.SESSION_SECRET,
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
      apiKey: process.env.CLOUDINARY_API_KEY || '',
      apiSecret: process.env.CLOUDINARY_API_SECRET || ''
    }
  };
}

module.exports = { getConfig };
