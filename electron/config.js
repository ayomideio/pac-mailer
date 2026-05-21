/**
 * Remote access control — JSON hosted on GitHub (raw URL).
 *
 * 1. Create a public repo (e.g. pac-mailer-access) with access.json
 * 2. Replace ACCESS_CONFIG_URL below with your raw.githubusercontent.com URL
 * 3. Set "active": false in access.json to block all users
 */
module.exports = {
  ACCESS_CONFIG_URL:
    process.env.ACCESS_CONFIG_URL ||
    'https://raw.githubusercontent.com/ayomideio/pac-mailer/main/access.json',

  /** Allow app to run offline using last successful check (milliseconds). */
  OFFLINE_GRACE_MS: 7 * 24 * 60 * 60 * 1000,
};
