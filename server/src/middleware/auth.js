/**
 * src/middleware/auth.js
 *
 * JWT authentication middleware.
 * Reads the JWT from the httpOnly cookie named "token", verifies it,
 * and attaches the decoded payload to req.user for downstream handlers.
 *
 * Usage: app.use('/api/protected', auth, protectedRouter)
 */

const jwt = require('jsonwebtoken');

/**
 * Protect routes that require a valid session.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function auth(req, res, next) {
  // Extract token from the httpOnly cookie set at login/register
  const token = req.cookies && req.cookies.token;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized',
    });
  }

  try {
    // Verify signature and expiry; throws on failure
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach decoded payload (userId, email, iat, exp) to the request object
    req.user = decoded;

    next();
  } catch (err) {
    // Pass JWT errors to the centralised error handler so they are
    // formatted consistently (JsonWebTokenError / TokenExpiredError → 401)
    next(err);
  }
}

module.exports = auth;
