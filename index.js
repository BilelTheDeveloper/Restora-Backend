import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import connectDB from './src/config/db.js';
import routes from './src/routes/index.js';
import { errorHandler, notFound } from './src/middleware/errorHandler.js';
import { apiLimiter, sanitize, hppProtect } from './src/middleware/security.js';

dotenv.config();

const isProd = process.env.NODE_ENV === 'production';

if (isProd && !process.env.CLIENT_URL) {
  console.warn('⚠️  WARNING: CLIENT_URL is not set — CORS will block all browser requests in production!');
}

// Strip trailing slashes so "https://app.vercel.app/" and "https://app.vercel.app" both work
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((o) => o.trim().replace(/\/$/, ''))
  : ['http://localhost:5173'];

console.log('CORS allowed origins:', allowedOrigins);

const app = express();
const httpServer = createServer(app);

export const io = new Server(httpServer, {
  cors: { origin: allowedOrigins, methods: ['GET', 'POST'], credentials: true },
});

app.set('trust proxy', 1);

connectDB();

// ─── Security headers ──────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: isProd ? undefined : false,
}));

// ─── CORS ──────────────────────────────────────────────────
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));

// ─── Rate limiting ─────────────────────────────────────────
app.use('/api', apiLimiter);

// ─── Body parsing ──────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Sanitization & HPP ────────────────────────────────────
app.use(sanitize);
app.use(hppProtect);

// ─── Logging (dev only) ────────────────────────────────────
if (!isProd) app.use(morgan('dev'));

// ─── Health check ──────────────────────────────────────────
app.get('/health', (req, res) =>
  res.json({ status: 'ok', app: 'Restora API', env: process.env.NODE_ENV })
);

// ─── Routes ────────────────────────────────────────────────
app.use('/api', routes);

// ─── Error handling ────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Socket.IO ─────────────────────────────────────────────
io.on('connection', (socket) => {
  socket.on('join-restaurant', (restaurantId) => {
    socket.join(`restaurant:${restaurantId}`);
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Restora API on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});
