import rateLimit from 'express-rate-limit';

// General API rate limit
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

// Strict limit for auth routes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts, please wait 15 minutes.' },
  skipSuccessfulRequests: true,
});

// Strip MongoDB operator keys ($, .) from an object in-place.
// express-mongo-sanitize is incompatible with Express 5 (tries to reassign
// req.query which is a read-only getter), so we inline the logic here.
function stripOperators(obj) {
  if (!obj || typeof obj !== 'object') return;
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$') || key.includes('.')) {
      delete obj[key];
    } else {
      stripOperators(obj[key]);
    }
  }
}

export const sanitize = (req, _res, next) => {
  stripOperators(req.body);
  stripOperators(req.params);
  next();
};
