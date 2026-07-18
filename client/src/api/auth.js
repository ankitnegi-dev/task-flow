import api from './axios'

/**
 * Authentication API functions.
 * All responses return the axios response object; callers access .data.
 */

/**
 * Register a new user account.
 * @param {{ name: string, email: string, password: string }} data
 */
export const register = (data) => api.post('/auth/register', data)

/**
 * Log in with email and password.
 * The server sets an HTTP-only cookie on success.
 * @param {{ email: string, password: string }} data
 */
export const login = (data) => api.post('/auth/login', data)

/**
 * Log out the current user.
 * The server clears the auth cookie.
 */
export const logout = () => api.post('/auth/logout')

/**
 * Fetch the currently authenticated user's profile.
 * Used to verify the session on protected route mount.
 */
export const getMe = () => api.get('/auth/me')
