import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';

// General API rate limit
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

// Strict limit for auth routes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts, please wait 15 minutes.' },
  skipSuccessfulRequests: true,
});

// NoSQL injection sanitizer — strips $ and . from req.body, query, params
export const sanitize = mongoSanitize({ replaceWith: '_' });

// HTTP Parameter Pollution protection
export const hppProtect = hpp({
  whitelist: ['sort', 'fields', 'page', 'limit', 'cuisine', 'city'],
});
