import Alert from '../models/Alert.js';
import { success, paginated } from '../utils/apiResponse.js';

export const getAlerts = async (req, res, next) => {
  try {
    const { unread, type, page = 1, limit = 30 } = req.query;
    const filter = { restaurant: req.user.restaurant, isDismissed: false };
    if (unread === 'true') filter.isRead = false;
    if (type) filter.type = type;

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Alert.countDocuments(filter);
    const alerts = await Alert.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const unreadCount = await Alert.countDocuments({ restaurant: req.user.restaurant, isRead: false, isDismissed: false });

    paginated(res, { alerts, unreadCount }, { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

export const markAlertRead = async (req, res, next) => {
  try {
    await Alert.findOneAndUpdate(
      { _id: req.params.id, restaurant: req.user.restaurant },
      { isRead: true }
    );
    success(res, null, 'Alert marked as read');
  } catch (err) {
    next(err);
  }
};

export const markAllRead = async (req, res, next) => {
  try {
    await Alert.updateMany({ restaurant: req.user.restaurant, isRead: false }, { isRead: true });
    success(res, null, 'All alerts marked as read');
  } catch (err) {
    next(err);
  }
};

export const dismissAlert = async (req, res, next) => {
  try {
    await Alert.findOneAndUpdate(
      { _id: req.params.id, restaurant: req.user.restaurant },
      { isDismissed: true }
    );
    success(res, null, 'Alert dismissed');
  } catch (err) {
    next(err);
  }
};

export const getUnreadCount = async (req, res, next) => {
  try {
    const count = await Alert.countDocuments({
      restaurant: req.user.restaurant,
      isRead: false,
      isDismissed: false,
    });
    success(res, { count });
  } catch (err) {
    next(err);
  }
};
