/**
 * src/middleware/rateLimiter.js
 *
 * Rate-limiting middleware built with express-rate-limit.
 * Prevents brute-force attacks on authentication endpoints.
 */

const rateLimit = require('express-rate-limit');

/**
 * loginRateLimiter
 *
 * Applied to POST /api/auth/login.
 * Allows a maximum of 10 login attempts per IP within a 15-minute window.
 * After the limit is reached, further requests receive a 429 response.
 */
const loginRateLimiter = rateLimit({
  // 15-minute sliding window
  windowMs: 15 * 60 * 1000,

  // Maximum number of requests per window per IP
  max: 10,

  // Do NOT count successful responses against the limit.
  // This ensures legitimate users are not blocked after authenticating once.
  skipSuccessfulRequests: true,

  // Use a consistent JSON shape matching the rest of the API
  message: {
    success: false,
    message: 'Too many login attempts, please try again later',
  },

  // express-rate-limit v7+ prefers standardHeaders and legacyHeaders options
  standardHeaders: true,  // Return RateLimit-* headers per RFC 6585
  legacyHeaders: false,   // Disable the deprecated X-RateLimit-* headers
});

module.exports = { loginRateLimiter };
