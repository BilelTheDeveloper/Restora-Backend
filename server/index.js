import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import connectDB from './src/config/db.js';
import routes from './src/routes/index.js';
import { setIO } from './src/socket.js';
import { startAlertEngine } from './src/services/alertEngine.js';
import { errorHandler, notFound } from './src/middleware/errorHandler.js';
import { apiLimiter, sanitize } from './src/middleware/security.js';
import { maintenanceGuard } from './src/middleware/maintenance.js';
import User from './src/models/User.js';

dotenv.config();

const isProd = process.env.NODE_ENV === 'production';

if (isProd && !process.env.CLIENT_URL) {
  console.warn('⚠️  WARNING: CLIENT_URL is not set — CORS will block all browser requests in production!');
}

const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((o) => o.trim().replace(/\/$/, ''))
  : ['http://localhost:5173'];

const app = express();
const httpServer = createServer(app);

export const io = new Server(httpServer, {
  cors: { origin: allowedOrigins, methods: ['GET', 'POST'], credentials: true },
});
setIO(io);

app.set('trust proxy', 1);

connectDB();

// ─── Security headers ──────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: isProd
    ? {
        directives: {
          defaultSrc:     ["'self'"],
          scriptSrc:      ["'self'", "'unsafe-inline'"],
          styleSrc:       ["'self'", "'unsafe-inline'"],
          imgSrc:         ["'self'", 'data:', 'blob:', 'https:'],
          mediaSrc:       ["'self'", 'blob:'],
          connectSrc:     ["'self'", ...allowedOrigins, 'https://restora-backend-uxh8.onrender.com'],
          fontSrc:        ["'self'", 'data:'],
          objectSrc:      ["'none'"],
          frameSrc:       ["'none'"],
          baseUri:        ["'none'"],
          formAction:     ["'self'"],
          upgradeInsecureRequests: [],
        },
      }
    : false,
  hsts: isProd ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  hidePoweredBy: true,
}));

// ─── Additional security headers ───────────────────────────
app.use((_req, res, next) => {
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=()');
  res.setHeader('X-Request-ID', randomUUID());
  next();
});

// ─── CORS ──────────────────────────────────────────────────
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
}));

// ─── Cookie parsing ────────────────────────────────────────
app.use(cookieParser());

// ─── Rate limiting ─────────────────────────────────────────
app.use('/api', apiLimiter);

// ─── Body parsing ──────────────────────────────────────────
// KYC sends base64 images — keep 10mb; all other routes use 2mb limit
app.use('/api/auth/kyc', express.json({ limit: '10mb' }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// ─── Sanitization ──────────────────────────────────────────
app.use(sanitize);

// ─── Logging ───────────────────────────────────────────────
if (!isProd) app.use(morgan('dev'));
else         app.use(morgan('combined'));

// ─── Health check (public) ─────────────────────────────────
app.get('/health', (_req, res) =>
  res.json({ status: 'ok', app: 'Restora API', env: process.env.NODE_ENV, ts: new Date().toISOString() })
);

// ─── Maintenance guard (before routes) ─────────────────────
app.use(maintenanceGuard);

// ─── Routes ────────────────────────────────────────────────
app.use('/api', routes);

// ─── Error handling ────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Socket.IO — authenticated room joining ─────────────────
io.on('connection', (socket) => {
  socket.on('join-restaurant', async (restaurantId) => {
    const token = socket.handshake.auth?.token;
    if (!token) { socket.disconnect(true); return; }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('restaurant role isActive');
      if (!user || !user.isActive) { socket.disconnect(true); return; }

      // Superadmins can join any room; owners/staff only their own restaurant
      const isAuthorized =
        user.role === 'superadmin' ||
        user.restaurant?.toString() === restaurantId;

      if (!isAuthorized) return; // silent — don't disconnect, just don't join
      socket.join(`restaurant:${restaurantId}`);
    } catch {
      socket.disconnect(true);
    }
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Restora API on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  startAlertEngine();
});
