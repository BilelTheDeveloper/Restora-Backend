import jwt from 'jsonwebtoken';
import SystemConfig from '../models/SystemConfig.js';
import User from '../models/User.js';

// 5-second in-memory cache to avoid a DB hit on every single request
let _enabled   = false;
let _cacheTime = 0;
let _message   = '';
let _until     = null;

export const invalidateMaintenanceCache = () => { _cacheTime = 0; };

async function isMaintenanceOn() {
  if (Date.now() - _cacheTime < 5000) return { enabled: _enabled, message: _message, until: _until };
  const cfg = await SystemConfig.findOne({ key: 'global' }).select('maintenance').lean();
  _enabled   = cfg?.maintenance?.enabled ?? false;
  _message   = cfg?.maintenance?.message ?? '';
  _until     = cfg?.maintenance?.scheduledUntil ?? null;
  _cacheTime = Date.now();
  return { enabled: _enabled, message: _message, until: _until };
}

// Paths that are NEVER blocked during maintenance
const BYPASS_PATHS = [
  '/health',
  '/api/status',
  '/api/auth/login',
  '/api/auth/register',
];

export const maintenanceGuard = async (req, res, next) => {
  // Always let bypass paths through
  if (BYPASS_PATHS.some(p => req.originalUrl.startsWith(p))) return next();

  const { enabled, message, until } = await isMaintenanceOn();
  if (!enabled) return next();

  // Check if the caller is a superadmin (they always bypass)
  const raw = req.headers.authorization;
  if (raw?.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(raw.split(' ')[1], process.env.JWT_SECRET);
      const user    = await User.findById(decoded.id).select('role').lean();
      if (user?.role === 'superadmin') return next();
    } catch { /* invalid token → fall through to maintenance response */ }
  }

  return res.status(503).json({
    success:         false,
    maintenanceMode: true,
    message:         message || "We're under maintenance. Back shortly!",
    scheduledUntil:  until,
  });
};
