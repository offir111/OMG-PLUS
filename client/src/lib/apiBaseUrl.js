/**
 * Returns the API base URL for fetch calls.
 * In production: VITE_API_URL env var (Railway server)
 * In dev: empty string → Vite proxy to localhost:3001
 */
export function getApiBaseUrl() {
  const raw = (import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '');
  if (raw) return raw;
  if (import.meta.env.DEV) return '';
  return 'https://omg-plus-production.up.railway.app';
}
