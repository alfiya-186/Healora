
/**
 * Healora Secure API Client
 * Connects the frontend to the deployed Django backend.
 * Automatically attaches JWT Bearer tokens.
 */

// In production, fallback automatically to Render backend if env var is not set on Vercel
const API_BASE = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? 'https://healora-backend-ru0c.onrender.com' : '');

export const apiUrl = (url) => {
  if (/^https?:\/\//i.test(url)) return url;

  const path = url.startsWith('/') ? url : `/${url}`;
  return `${API_BASE}${path}`;
};

export const secureFetch = async (url, options = {}) => {
  const token = localStorage.getItem('access_token');
  const isFormData = options.body instanceof FormData;

  const headers = {
    Accept: 'application/json',
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const fullUrl = apiUrl(url);

  try {
    const response = await fetch(fullUrl, { ...options, headers });

    if (response.status === 401) {
      console.warn(`[Healora Auth] 401 Unauthorized: ${fullUrl}`);

      if (
        !window.location.pathname.startsWith('/signin') &&
        !window.location.pathname.startsWith('/signup') &&
        window.location.pathname !== '/'
      ) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_role');
        window.location.href = '/signin';
      }
    }

    return response;
  } catch (error) {
    console.error(
      `[Healora API Error] ${options.method || 'GET'} ${fullUrl}:`,
      error
    );
    throw error;
  }
};

export default secureFetch;
