/**
 * Local dev: Vite proxies /api → localhost:5000
 * Vercel: backend service is mounted at /_/backend
 */
export const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? '/_/backend/api' : '/api');
