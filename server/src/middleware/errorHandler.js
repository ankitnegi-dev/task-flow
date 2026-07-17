/**
 * src/middleware/errorHandler.js
 *
 * Centralised error-handling middleware for Express.
 * Must be registered LAST (after all routes) with four parameters so Express
 * recognises it as an error handler.
 *
 * Maps well-known error types to appropriate HTTP status codes and sanitises
 * responses so internals are never leaked to clients in production.
 */

/**
 * @param {Error}                      err
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} _next  (required even if unused)
 */
function errorHandler(err, req, res, _next) {
  const isDev = process.env.NODE_ENV !== 'production';

  // Default to 500 Internal Server Error
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  // ── Prisma client errors ───────────────────────────────────────────────────
  // Prisma surfaces specific error codes we can map to HTTP semantics
  if (err.code) {
    switch (err.code) {
      case 'P2002':
        // Unique constraint violation (e.g. duplicate email)
        statusCode = 409;
        message = 'A record with that value already exists';
        break;

      case 'P2025':
        // Record not found (e.g. update/delete on missing row)
        statusCode = 404;
        message = 'Record not found';
        break;

      case 'P2003':
        // Foreign key constraint failure
        statusCode = 400;
        message = 'Related record not found';
        break;

      default:
        // Other Prisma errors - treat as server errors but still log them
        statusCode = 500;
        message = isDev ? err.message : 'Database error';
    }
  }

  // ── JWT errors ────────────────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Unauthorized';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Session expired, please log in again';
  }

  // ── Express-validator errors ──────────────────────────────────────────────
  // These are forwarded from the validate middleware and already formatted,
  // but handle them here as a safety net with a 422 status.
  if (err.name === 'ValidationError') {
    statusCode = 422;
    message = err.message || 'Validation failed';
  }

  // ── Build response ────────────────────────────────────────────────────────
  const response = {
    success: false,
    message,
  };

  // In development mode, expose the stack trace and raw error details
  // to help with debugging - never in production.
  if (isDev) {
    response.error = {
      name: err.name,
      stack: err.stack,
    };
  }

  // Log server errors so they appear in application logs
  if (statusCode >= 500) {
    console.error(`[ERROR] ${req.method} ${req.originalUrl}`, err);
  }

  res.status(statusCode).json(response);
}

module.exports = errorHandler;
