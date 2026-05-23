import SecurityLog from '../models/SecurityLog.js';
import User from '../models/User.js';
import { success } from '../utils/apiResponse.js';

// Owner: get their own security events
export const getMySecurityLogs = async (req, res, next) => {
  try {
    const logs = await SecurityLog.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    success(res, logs);
  } catch (err) {
    next(err);
  }
};

// Owner: security summary for their account
export const getMySecuritySummary = async (req, res, next) => {
  try {
    const since24h  = new Date(Date.now() - 24 * 3600 * 1000);
    const since7d   = new Date(Date.now() - 7  * 24 * 3600 * 1000);
    const since30d  = new Date(Date.now() - 30 * 24 * 3600 * 1000);

    const [
      failedToday,
      failedWeek,
      loginHistoryRaw,
      alertCount,
    ] = await Promise.all([
      SecurityLog.countDocuments({ event: 'login_failed', email: req.user.email, createdAt: { $gte: since24h } }),
      SecurityLog.countDocuments({ event: 'login_failed', email: req.user.email, createdAt: { $gte: since7d } }),
      SecurityLog.find({
        userId: req.user._id,
        event: { $in: ['login_success', 'login_failed'] },
        createdAt: { $gte: since30d },
      }).sort({ createdAt: -1 }).limit(20).lean(),
      SecurityLog.countDocuments({
        userId: req.user._id,
        severity: { $in: ['alert', 'critical'] },
        createdAt: { $gte: since7d },
      }),
    ]);

    // Score: start at 100, deduct for issues
    let score = 100;
    if (failedToday >= 3)   score -= 20;
    if (failedWeek  >= 10)  score -= 15;
    if (alertCount  >= 1)   score -= 25;
    const user = req.user;
    if (!user.phone)        score -= 5;

    score = Math.max(0, score);
    const grade =
      score >= 90 ? 'A' :
      score >= 75 ? 'B' :
      score >= 60 ? 'C' :
      score >= 40 ? 'D' : 'F';

    success(res, {
      score,
      grade,
      failedLogins: { today: failedToday, week: failedWeek },
      alerts: alertCount,
      loginHistory: loginHistoryRaw.map(l => ({
        id:        l._id,
        event:     l.event,
        severity:  l.severity,
        ip:        l.ip,
        userAgent: l.userAgent,
        message:   l.message,
        createdAt: l.createdAt,
      })),
    });
  } catch (err) {
    next(err);
  }
};

// Superadmin: platform-wide security summary
export const getPlatformSecuritySummary = async (req, res, next) => {
  try {
    const since24h = new Date(Date.now() - 24 * 3600 * 1000);
    const since7d  = new Date(Date.now() - 7 * 24 * 3600 * 1000);

    const [
      totalFailed24h,
      totalAlerts7d,
      recentAlerts,
      eventBreakdown,
    ] = await Promise.all([
      SecurityLog.countDocuments({ event: 'login_failed', createdAt: { $gte: since24h } }),
      SecurityLog.countDocuments({ severity: { $in: ['alert', 'critical'] }, createdAt: { $gte: since7d } }),
      SecurityLog.find({ severity: { $in: ['alert', 'critical'] }, createdAt: { $gte: since7d } })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate('userId', 'name email')
        .lean(),
      SecurityLog.aggregate([
        { $match: { createdAt: { $gte: since7d } } },
        { $group: { _id: '$event', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    success(res, {
      summary: {
        failedLogins24h: totalFailed24h,
        alerts7d:        totalAlerts7d,
      },
      recentAlerts,
      eventBreakdown,
    });
  } catch (err) {
    next(err);
  }
};
