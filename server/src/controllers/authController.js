/**
 * src/controllers/authController.js
 *
 * Authentication controller for TaskFlow.
 * Handles user registration, login, logout, and "get current user" endpoints.
 *
 * All passwords are hashed with bcrypt before storage.
 * Sessions are maintained via a JWT stored in an httpOnly cookie.
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ─── Constants ────────────────────────────────────────────────────────────────

const BCRYPT_ROUNDS = 10;

// Cookie max-age: 7 days in milliseconds
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Sign a JWT containing the user's id and email.
 *
 * @param {{ id: string, email: string }} user
 * @returns {string} signed token
 */
function signToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

/**
 * Attach the JWT to the response as an httpOnly cookie.
 * Secure flag is enabled only in production to allow testing over plain HTTP.
 *
 * @param {import('express').Response} res
 * @param {string} token
 */
function setCookieToken(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: COOKIE_MAX_AGE_MS,
  });
}

/**
 * Strip the password field from a user record before sending it to the client.
 *
 * @param {object} user - Prisma User record
 * @returns {{ id, name, email, createdAt }}
 */
function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 *
 * Creates a new user account.
 * Returns 409 if the email is already registered.
 */
async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    // Check for duplicate email before attempting to insert
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with that email already exists',
      });
    }

    // Hash the password - never store plaintext
    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });

    const token = signToken(user);
    setCookieToken(res, token);

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: sanitizeUser(user),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/login
 *
 * Authenticates an existing user.
 * Returns 401 for both "email not found" and "wrong password" to prevent
 * user-enumeration attacks.
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    // Lookup user - generic error on miss to prevent user enumeration
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Constant-time password comparison via bcrypt
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const token = signToken(user);
    setCookieToken(res, token);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: sanitizeUser(user),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/logout
 *
 * Clears the JWT cookie effectively ending the session.
 * No DB interaction is required - JWTs are stateless.
 */
function logout(req, res) {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  return res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
}

/**
 * GET /api/auth/me
 *
 * Returns the profile of the currently authenticated user.
 * Requires the auth middleware to run first (req.user is populated).
 */
async function getMe(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: sanitizeUser(user),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, logout, getMe };
