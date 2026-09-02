/**
 * Nexa OS — Command Centre
 * js/config.js
 *
 * EDIT INI setelah GAS di-deploy ulang:
 * Ganti GAS_API_URL dengan URL deployment GAS kamu.
 *
 * Format URL GAS:
 *   https://script.google.com/macros/s/SCRIPT_ID/exec
 */

const NEXA_CONFIG = {
  // ── Wajib diisi ───────────────────────────────────────────
  // URL backend Nexa OS (Express)
  API_URL: 'https://nexa-os-pmr8.onrender.com/api/admin',

  // Versi dashboard
  VERSION: '1.0.0-alpha',
  BUILD_DATE: '2026-08-11',

  // Refresh interval untuk auto-reload data (milliseconds)
  // 0 = tidak auto-refresh
  AUTO_REFRESH_MS: 0,

  // Session storage key untuk admin key
  SESSION_KEY: 'NEXA_ADMIN_SESSION',

  // Timeout fetch request (ms) (dinaikkan ke 60 detik untuk mencegah timeout saat cold start Render)
  FETCH_TIMEOUT_MS: 60000,
};
