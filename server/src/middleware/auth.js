import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  const token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.split(' ')[1]
    : null;

  if (!token) {
    res.status(401);
    return next(new Error('Not authorized — no token'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Reject refresh tokens used as access tokens
    if (decoded.type && decoded.type !== 'access') {
      res.status(401);
      return next(new Error('Not authorized — wrong token type'));
    }

    const user = await User.findById(decoded.id).select('-password -refreshTokens -loginAttempts -lockUntil');
    if (!user || !user.isActive) {
      res.status(401);
      return next(new Error('Not authorized — user not found or inactive'));
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401);
    next(new Error('Not authorized — invalid token'));
  }
};

export const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    res.status(403);
    return next(new Error(`Role '${req.user?.role}' is not authorized`));
  }
  next();
};
