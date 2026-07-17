/**
 * src/routes/authRoutes.js
 *
 * Authentication routes mounted at /api/auth.
 *
 * POST /register  - create a new account
 * POST /login     - authenticate and receive a session cookie
 * POST /logout    - clear the session cookie
 * GET  /me        - retrieve the current user's profile (protected)
 */

const express = require('express');
const router = express.Router();

const { register, login, logout, getMe } = require('../controllers/authController');
const auth = require('../middleware/auth');
const { loginRateLimiter } = require('../middleware/rateLimiter');
const { validationRules, validate } = require('../middleware/validate');

/**
 * POST /api/auth/register
 * Public - no authentication required.
 * Validates input, then creates a new user and sets a session cookie.
 */
router.post(
  '/register',
  validationRules.register,
  validate,
  register
);

/**
 * POST /api/auth/login
 * Public - guarded by rate limiter to prevent brute-force attacks.
 * Validates credentials, then sets a session cookie on success.
 */
router.post(
  '/login',
  loginRateLimiter,
  validationRules.login,
  validate,
  login
);

/**
 * POST /api/auth/logout
 * Public - clearing a cookie does not require a valid token.
 * Removes the session cookie from the client.
 */
router.post('/logout', logout);

/**
 * GET /api/auth/me
 * Protected - requires a valid JWT cookie.
 * Returns the authenticated user's profile (without password).
 */
router.get('/me', auth, getMe);

module.exports = router;
