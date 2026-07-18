import axios from 'axios'

/**
 * Configured axios instance for all TaskFlow API requests.
 * - baseURL set to '/api' (proxied by Vite dev server or nginx in production)
 * - withCredentials ensures HTTP-only auth cookies are sent with every request
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * Response interceptor:
 * - Unwraps the backend's standard { success, message, data } envelope
 *   so callers can access response.data directly instead of response.data.data.
 * - On 401 Unauthorized responses (token expired or not authenticated),
 *   redirect to /login unless the failing request was itself an auth endpoint
 *   (avoids redirect loops on login/register failures).
 */
api.interceptors.response.use(
  (response) => {
    // Auto-unwrap the { success, message, data } envelope when present
    if (
      response.data &&
      typeof response.data === 'object' &&
      'success' in response.data &&
      'data' in response.data
    ) {
      response.data = response.data.data
    }
    return response
  },
  (error) => {
    const status = error.response?.status
    const requestUrl = error.config?.url || ''

    if (status === 401 && !requestUrl.includes('/auth/')) {
      window.location.href = '/login'
    }

    return Promise.reject(error)
  }
)

export default api