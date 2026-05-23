import rateLimit from 'express-rate-limit';

// General API rate limit
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

// Strict limit for auth routes (login/register)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many auth attempts, please wait 15 minutes.' },
  skipSuccessfulRequests: true,
});

// KYC submission limit — expensive operation, max 5 per hour
export const kycLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many KYC submissions, please wait an hour.' },
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
  // Note: req.query is read-only in Express 5; sanitize individual values at point of use
  next();
};

// Validate base64 string is within acceptable size
export const validateBase64Size = (b64, maxMB = 5) => {
  if (!b64 || typeof b64 !== 'string') return false;
  // Strip data URL prefix if present
  const data = b64.includes(',') ? b64.split(',')[1] : b64;
  const sizeBytes = (data.length * 3) / 4;
  return sizeBytes <= maxMB * 1024 * 1024;
};
