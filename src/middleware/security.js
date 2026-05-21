import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';

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

// NoSQL injection sanitizer — Express 5 makes req.query a read-only getter,
// so we sanitize only req.body and req.params manually instead of using the
// express-mongo-sanitize middleware directly (which tries to reassign all three).
export const sanitize = (req, _res, next) => {
  if (req.body) req.body = mongoSanitize.sanitize(req.body, { replaceWith: '_' });
  if (req.params) req.params = mongoSanitize.sanitize(req.params, { replaceWith: '_' });
  next();
};
