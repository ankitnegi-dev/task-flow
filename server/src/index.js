/**
 * src/index.js
 *
 * Entry point for the TaskFlow API server.
 * Bootstraps Express, connects Prisma, and starts listening.
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const tagRoutes = require('./routes/tagRoutes');
const errorHandler = require('./middleware/errorHandler');

// ─── Prisma singleton ────────────────────────────────────────────────────────
const prisma = new PrismaClient();

// ─── App configuration ───────────────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// ─── Security & utility middleware ───────────────────────────────────────────

// helmet sets secure HTTP headers (relax CSP to allow the SPA to load scripts/styles)
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// HTTP request logger (combined in production, dev-friendly in development)
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// CORS: allow the configured client origin with credentials (cookies)
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true, // required for httpOnly cookie transport
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Parse incoming JSON bodies (limit kept reasonable)
app.use(express.json({ limit: '10kb' }));

// Parse URL-encoded bodies (for form submissions)
app.use(express.urlencoded({ extended: true }));

// Parse cookies so JWT can be read from req.cookies.token
app.use(cookieParser());

// ─── Health check ────────────────────────────────────────────────────────────
/**
 * GET /api/health
 * Lightweight liveness probe used by load balancers / container orchestrators.
 */
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'TaskFlow API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ─── API routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/tags', tagRoutes);

// ─── Serve React frontend static files ────────────────────────────────────────
const STATIC_DIR = path.join(__dirname, '..', 'public');
app.use(express.static(STATIC_DIR));

// SPA fallback: for any non-API route, serve index.html so React Router works
app.get('*', (req, res) => {
  const indexPath = path.join(STATIC_DIR, 'index.html');
  // Ensure index.html exists before serving it
  const fs = require('fs');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ success: false, message: 'Route not found' });
  }
});

// ─── Centralised error handler (must be last) ────────────────────────────────
app.use(errorHandler);

// ─── Start server ─────────────────────────────────────────────────────────────
async function startServer() {
  try {
    // Verify database connectivity before accepting traffic
    await prisma.$connect();
    console.log('Database connection established successfully.');

    app.listen(PORT, () => {
      console.log('─────────────────────────────────────────');
      console.log(`  TaskFlow API Server`);
      console.log(`  Port        : ${PORT}`);
      console.log(`  Environment : ${process.env.NODE_ENV || 'development'}`);
      console.log(`  Client URL  : ${CLIENT_URL}`);
      console.log('─────────────────────────────────────────');
    });
  } catch (error) {
    console.error('Failed to connect to the database:', error);
    process.exit(1);
  }
}

// Gracefully disconnect Prisma on shutdown signals
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  console.log('Prisma disconnected. Shutting down.');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

startServer();

module.exports = app; // exported for testing
