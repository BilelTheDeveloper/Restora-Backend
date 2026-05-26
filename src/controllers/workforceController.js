import StaffShift from '../models/StaffShift.js';
import Order from '../models/Order.js';
import { success } from '../utils/apiResponse.js';

const HOURLY_RATES = { manager: 8, waiter: 5, cashier: 5, kitchen: 6, driver: 5, owner: 12 };

function calcHours(startTime, endTime) {
  if (!startTime || !endTime) return 0;
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  return Math.max(0, (eh * 60 + em - (sh * 60 + sm)) / 60);
}

export const getLaborAnalytics = async (req, res) => {
  try {
    const restaurantId = req.user.restaurant;
    const days = parseInt(req.query.days) || 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const [shifts, revenueAgg] = await Promise.all([
      StaffShift.find({ restaurant: restaurantId, date: { $gte: since } }).populate('staff', 'name role email'),
      Order.aggregate([
        { $match: { restaurant: restaurantId, createdAt: { $gte: since }, status: { $nin: ['cancelled'] } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;
    const staffMap = {};
    shifts.forEach(shift => {
      const hours = calcHours(shift.startTime, shift.endTime);
      if (!hours) return;
      const rate = HOURLY_RATES[shift.role] || 5;
      const sId = shift.staff?._id?.toString() || 'unknown';
      if (!staffMap[sId]) staffMap[sId] = { name: shift.staff?.name || 'Unknown', role: shift.role, hours: 0, wages: 0, shifts: 0, overtime: 0, rate };
      staffMap[sId].hours += hours;
      staffMap[sId].wages += hours * rate;
      staffMap[sId].shifts += 1;
      if (hours > 8) staffMap[sId].overtime += hours - 8;
    });
    const staffList = Object.values(staffMap).map(s => ({ ...s, hours: Math.round(s.hours * 10) / 10, wages: Math.round(s.wages * 100) / 100, overtime: Math.round(s.overtime * 10) / 10 }));
    const totalHours = staffList.reduce((s, x) => s + x.hours, 0);
    const totalWages = staffList.reduce((s, x) => s + x.wages, 0);
    const laborCostPercent = totalRevenue > 0 ? (totalWages / totalRevenue) * 100 : 0;
    const costPerHour = totalHours > 0 ? totalWages / totalHours : 0;
    const alerts = [];
    staffList.filter(s => s.overtime > 2).forEach(s => alerts.push({ type: 'overtime', name: s.name, message: `${s.name} has ${s.overtime}h overtime`, severity: s.overtime > 5 ? 'critical' : 'warning' }));
    if (laborCostPercent > 35) alerts.push({ type: 'high_labor_cost', message: `Labor cost is ${laborCostPercent.toFixed(1)}% — target below 35%`, severity: 'warning' });
    success(res, { summary: { totalHours: Math.round(totalHours * 10) / 10, totalWages: Math.round(totalWages * 100) / 100, laborCostPercent: Math.round(laborCostPercent * 10) / 10, costPerHour: Math.round(costPerHour * 100) / 100, totalRevenue: Math.round(totalRevenue * 100) / 100, period: `${days} days` }, staff: staffList.sort((a, b) => b.wages - a.wages), alerts });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const getPayrollSummary = async (req, res) => {
  try {
    const restaurantId = req.user.restaurant;
    const m = parseInt(req.query.month) || new Date().getMonth() + 1;
    const y = parseInt(req.query.year) || new Date().getFullYear();
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0, 23, 59, 59);
    const shifts = await StaffShift.find({ restaurant: restaurantId, date: { $gte: start, $lte: end } }).populate('staff', 'name email role');
    const payroll = {};
    shifts.forEach(shift => {
      const hours = calcHours(shift.startTime, shift.endTime);
      if (!hours) return;
      const sId = shift.staff?._id?.toString() || 'unknown';
      const rate = HOURLY_RATES[shift.role] || 5;
      if (!payroll[sId]) payroll[sId] = { staff: shift.staff, role: shift.role, regularHours: 0, overtimeHours: 0, rate, regularPay: 0, overtimePay: 0, shifts: 0, attendance: { present: 0, late: 0, absent: 0 } };
      const reg = Math.min(hours, 8);
      const ot = Math.max(0, hours - 8);
      payroll[sId].shifts += 1;
      payroll[sId].regularHours += reg;
      payroll[sId].overtimeHours += ot;
      payroll[sId].regularPay += reg * rate;
      payroll[sId].overtimePay += ot * rate * 1.5;
      const att = ['present', 'late', 'absent'].includes(shift.status) ? shift.status : 'present';
      payroll[sId].attendance[att] = (payroll[sId].attendance[att] || 0) + 1;
    });
    const list = Object.values(payroll).map(p => ({ ...p, regularHours: Math.round(p.regularHours * 10) / 10, overtimeHours: Math.round(p.overtimeHours * 10) / 10, regularPay: Math.round(p.regularPay * 100) / 100, overtimePay: Math.round(p.overtimePay * 100) / 100, totalPay: Math.round((p.regularPay + p.overtimePay) * 100) / 100 }));
    success(res, { payroll: list, month: m, year: y, grandTotal: list.reduce((s, p) => s + p.totalPay, 0) });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const getStaffingForecast = async (req, res) => {
  try {
    const restaurantId = req.user.restaurant;
    const targetDate = req.query.date ? new Date(req.query.date) : new Date();
    const dayOfWeek = targetDate.getDay() + 1;
    const historical = await Order.aggregate([
      { $match: { restaurant: restaurantId, $expr: { $eq: [{ $dayOfWeek: '$createdAt' }, dayOfWeek] }, createdAt: { $gte: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000) }, status: { $nin: ['cancelled'] } } },
      { $group: { _id: { $hour: '$createdAt' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    const byHour = {};
    historical.forEach(h => { byHour[h._id] = (byHour[h._id] || 0) + h.count; });
    const recommendations = Object.entries(byHour).map(([hour, count]) => {
      const avgOrders = count / 4;
      return { hour: `${String(hour).padStart(2, '0')}:00`, expectedOrders: Math.round(avgOrders), neededWaiters: Math.max(1, Math.ceil(avgOrders / 3)), neededKitchen: Math.max(1, Math.ceil(avgOrders / 5)), isPeak: avgOrders > 5 };
    });
    success(res, { date: targetDate.toISOString().split('T')[0], recommendations });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
