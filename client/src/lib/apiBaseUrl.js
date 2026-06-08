/**
 * Returns API base URL:
 * - Mode 2 (Oh My God): Oh My God Railway server
 * - Mode 1 (OMG-PLUS): OMG-PLUS Railway server
 */
export function getApiBaseUrl() {
  // Mode 2 — Oh My God original server
  if (typeof window !== 'undefined' && window.__OHMY_MODE__) {
    return window.__OHMY_API_URL__ || 'https://oh-my-god-production.up.railway.app';
  }
  // Mode 1 — OMG-PLUS server
  const raw = (import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '');
  if (raw) return raw;
  if (import.meta.env.DEV) return '';
  return 'https://omg-plus-production.up.railway.app';
}
