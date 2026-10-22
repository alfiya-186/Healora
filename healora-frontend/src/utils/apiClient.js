/**
 * Healora Secure API Client
 * Automatically attaches JWT Bearer token from localStorage to all outgoing requests.
 * Handles 401 Unauthorized and session expiration securely.
 */

export const secureFetch = async (url, options = {}) => {
  const token = localStorage.getItem('access_token');
  const isFormData = options.body instanceof FormData;

  const headers = {
    'Accept': 'application/json',
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  try {
    const response = await fetch(url, { ...options, headers });
    if (response.status === 401) {
      console.warn(`[Healora Auth] 401 Unauthorized encountered on ${url}. Session expired or invalid token.`);
      // If unauthorized on protected routes, redirect cleanly
      if (!window.location.pathname.startsWith('/signin') && !window.location.pathname.startsWith('/signup') && window.location.pathname !== '/') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_role');
        window.location.href = '/signin';
      }
    }
    return response;
  } catch (error) {
    console.error(`[Healora API Error] ${options.method || 'GET'} ${url}:`, error);
    throw error;
  }
};

export default secureFetch;

