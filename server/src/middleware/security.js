import rateLimit from 'express-rate-limit';

// ── Rate limiters ──────────────────────────────────────────
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { success: false, message: 'Too many auth attempts, please wait 15 minutes.' },
});

export const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many refresh attempts.' },
});

export const kycLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many KYC submissions, please wait an hour.' },
});

// ── MongoDB operator injection prevention ──────────────────
// express-mongo-sanitize is incompatible with Express 5 (req.query is read-only),
// so we inline the logic and handle query params separately.
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

// Sanitize a single string value (for query param use)
export const sanitizeString = (val) => {
  if (typeof val !== 'string') return val;
  return val.replace(/[$]/g, '').replace(/\.\./g, '');
};

export const sanitize = (req, _res, next) => {
  stripOperators(req.body);
  stripOperators(req.params);
  // req.query is read-only in Express 5 — sanitize at point of use with sanitizeString()
  next();
};

// ── Suspicious request detector ────────────────────────────
const SUSPICIOUS_PATTERNS = [
  /<script/i, /javascript:/i, /on\w+\s*=/i,       // XSS
  /union.*select/i, /drop\s+table/i,               // SQL injection attempts
  /\.\.[/\\]/,                                     // Path traversal
  /\x00/,                                          // Null byte injection
];

export const detectSuspicious = (req, _res, next) => {
  const haystack = JSON.stringify({ body: req.body, query: req.query, params: req.params });
  if (SUSPICIOUS_PATTERNS.some(p => p.test(haystack))) {
    // Log asynchronously — don't block the request (legitimate edge cases exist)
    import('../models/SecurityLog.js').then(({ default: SecurityLog }) => {
      SecurityLog.create({
        event: 'suspicious_request',
        severity: 'alert',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        message: `Suspicious payload on ${req.method} ${req.path}`,
      }).catch(() => {});
    });
  }
  next();
};

// ── Base64 size guard ──────────────────────────────────────
export const validateBase64Size = (b64, maxMB = 5) => {
  if (!b64 || typeof b64 !== 'string') return false;
  const data = b64.includes(',') ? b64.split(',')[1] : b64;
  const sizeBytes = (data.length * 3) / 4;
  return sizeBytes <= maxMB * 1024 * 1024;
};
