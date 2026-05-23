import SystemConfig from '../models/SystemConfig.js';
import SecurityLog from '../models/SecurityLog.js';
import { invalidateMaintenanceCache } from '../middleware/maintenance.js';
import { success } from '../utils/apiResponse.js';

// ── Public status endpoint ─────────────────────────────────
export const getPublicStatus = async (req, res) => {
  try {
    const cfg = await SystemConfig.findOne({ key: 'global' }).select('maintenance').lean();
    return res.json({
      success: true,
      data: {
        maintenanceMode: cfg?.maintenance?.enabled ?? false,
        message:         cfg?.maintenance?.message ?? '',
        scheduledUntil:  cfg?.maintenance?.scheduledUntil ?? null,
      },
    });
  } catch {
    return res.json({ success: true, data: { maintenanceMode: false, message: '', scheduledUntil: null } });
  }
};

// ── Superadmin: get maintenance state ──────────────────────
export const getMaintenance = async (req, res, next) => {
  try {
    const cfg = await SystemConfig.findOne({ key: 'global' }).lean();
    success(res, cfg?.maintenance ?? { enabled: false, message: '', scheduledUntil: null });
  } catch (err) { next(err); }
};

// ── Superadmin: toggle maintenance mode ────────────────────
export const toggleMaintenance = async (req, res, next) => {
  try {
    const { enabled, message, scheduledUntil } = req.body;

    const cfg = await SystemConfig.findOneAndUpdate(
      { key: 'global' },
      {
        $set: {
          'maintenance.enabled':        !!enabled,
          'maintenance.message':         message?.trim() || "We're performing scheduled maintenance. We'll be back shortly!",
          'maintenance.scheduledUntil':  scheduledUntil || null,
          'maintenance.enabledAt':       enabled ? new Date() : null,
          'maintenance.enabledBy':       enabled ? req.user._id : null,
        },
      },
      { new: true, upsert: true }
    );

    // Bust the in-process cache immediately
    invalidateMaintenanceCache();

    // Audit log
    SecurityLog.create({
      event:    enabled ? 'maintenance_on' : 'maintenance_off',
      severity: 'alert',
      userId:   req.user._id,
      email:    req.user.email,
      ip:       req.ip || 'unknown',
      message:  `Maintenance mode ${enabled ? 'ENABLED' : 'DISABLED'} by ${req.user.name}`,
    }).catch(() => {});

    success(res, cfg.maintenance, `Maintenance mode ${enabled ? 'enabled' : 'disabled'}`);
  } catch (err) { next(err); }
};

// ── Superadmin: platform-wide security summary ─────────────
export const getPlatformSecuritySummary = async (req, res, next) => {
  try {
    const since1h  = new Date(Date.now() -  1 * 3600 * 1000);
    const since24h = new Date(Date.now() - 24 * 3600 * 1000);
    const since7d  = new Date(Date.now() -  7 * 24 * 3600 * 1000);

    const [
      failed1h, failed24h,
      alerts7d,
      recentAlerts,
      eventBreakdown,
      topIPs,
    ] = await Promise.all([
      SecurityLog.countDocuments({ event: 'login_failed', createdAt: { $gte: since1h  } }),
      SecurityLog.countDocuments({ event: 'login_failed', createdAt: { $gte: since24h } }),
      SecurityLog.countDocuments({ severity: { $in: ['alert', 'critical'] }, createdAt: { $gte: since7d } }),
      SecurityLog.find({ severity: { $in: ['alert', 'critical'] }, createdAt: { $gte: since7d } })
        .sort({ createdAt: -1 })
        .limit(30)
        .populate('userId', 'name email')
        .lean(),
      SecurityLog.aggregate([
        { $match: { createdAt: { $gte: since7d } } },
        { $group: { _id: '$event', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      SecurityLog.aggregate([
        { $match: { event: 'login_failed', createdAt: { $gte: since24h } } },
        { $group: { _id: '$ip', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
    ]);

    // Threat level
    const threatLevel =
      failed1h >= 20  ? 'critical' :
      failed24h >= 50 ? 'high'     :
      alerts7d  >= 10 ? 'medium'   : 'low';

    success(res, {
      threatLevel,
      failedLogins: { lastHour: failed1h, last24h: failed24h },
      alerts7d,
      recentAlerts,
      eventBreakdown,
      topSuspiciousIPs: topIPs,
    });
  } catch (err) { next(err); }
};

// ── Superadmin: platform-wide raw logs ────────────────────
export const getPlatformSecurityLogs = async (req, res, next) => {
  try {
    const { severity, event, limit = 100 } = req.query;
    const filter = {};
    if (severity) filter.severity = severity;
    if (event)    filter.event    = event;

    const logs = await SecurityLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(Math.min(Number(limit), 500))
      .populate('userId', 'name email')
      .lean();

    success(res, logs);
  } catch (err) { next(err); }
};
