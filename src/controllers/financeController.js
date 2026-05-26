import Expense from '../models/Expense.js';
import Order from '../models/Order.js';
import { success, created } from '../utils/apiResponse.js';

export const getExpenses = async (req, res) => {
  try {
    const { month, year, category } = req.query;
    const m = parseInt(month) || new Date().getMonth() + 1;
    const y = parseInt(year) || new Date().getFullYear();
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0, 23, 59, 59);
    const filter = { restaurant: req.user.restaurant, date: { $gte: start, $lte: end } };
    if (category) filter.category = category;
    const expenses = await Expense.find(filter).sort({ date: -1 });
    success(res, expenses);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const createExpense = async (req, res) => {
  try {
    const expense = await Expense.create({ ...req.body, restaurant: req.user.restaurant, createdBy: req.user._id });
    created(res, expense);
  } catch (err) { res.status(400).json({ message: err.message }); }
};

export const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, restaurant: req.user.restaurant },
      req.body, { new: true }
    );
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    success(res, expense);
  } catch (err) { res.status(400).json({ message: err.message }); }
};

export const deleteExpense = async (req, res) => {
  try {
    await Expense.findOneAndDelete({ _id: req.params.id, restaurant: req.user.restaurant });
    success(res, { deleted: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const getPnL = async (req, res) => {
  try {
    const rid = req.user.restaurant;
    const months = parseInt(req.query.months) || 6;
    const result = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const label = start.toLocaleString('default', { month: 'short', year: '2-digit' });
      const [revAgg, expAgg] = await Promise.all([
        Order.aggregate([
          { $match: { restaurant: rid, createdAt: { $gte: start, $lte: end }, status: { $nin: ['cancelled'] } } },
          { $group: { _id: null, revenue: { $sum: '$total' } } },
        ]),
        Expense.aggregate([
          { $match: { restaurant: rid, date: { $gte: start, $lte: end } } },
          { $group: { _id: null, expenses: { $sum: '$amount' } } },
        ]),
      ]);
      const revenue = revAgg[0]?.revenue || 0;
      const expenses = expAgg[0]?.expenses || 0;
      const profit = revenue - expenses;
      result.push({ label, revenue: Math.round(revenue * 100) / 100, expenses: Math.round(expenses * 100) / 100, profit: Math.round(profit * 100) / 100, margin: revenue > 0 ? Math.round((profit / revenue) * 1000) / 10 : 0 });
    }
    success(res, result);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const getFinanceSummary = async (req, res) => {
  try {
    const rid = req.user.restaurant;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const [curRevAgg, curExpAgg, prevRevAgg, prevExpAgg, expByCategory] = await Promise.all([
      Order.aggregate([{ $match: { restaurant: rid, createdAt: { $gte: monthStart }, status: { $nin: ['cancelled'] } } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
      Expense.aggregate([{ $match: { restaurant: rid, date: { $gte: monthStart } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Order.aggregate([{ $match: { restaurant: rid, createdAt: { $gte: prevMonthStart, $lte: prevMonthEnd }, status: { $nin: ['cancelled'] } } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
      Expense.aggregate([{ $match: { restaurant: rid, date: { $gte: prevMonthStart, $lte: prevMonthEnd } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Expense.aggregate([{ $match: { restaurant: rid, date: { $gte: monthStart } } }, { $group: { _id: '$category', total: { $sum: '$amount' } } }, { $sort: { total: -1 } }]),
    ]);
    const revenue = curRevAgg[0]?.total || 0;
    const expenses = curExpAgg[0]?.total || 0;
    const profit = revenue - expenses;
    const prevRevenue = prevRevAgg[0]?.total || 0;
    const prevExpenses = prevExpAgg[0]?.total || 0;
    const prevProfit = prevRevenue - prevExpenses;
    success(res, {
      revenue, expenses, profit,
      margin: revenue > 0 ? Math.round((profit / revenue) * 1000) / 10 : 0,
      prevRevenue, prevExpenses, prevProfit,
      revenueGrowth: prevRevenue > 0 ? Math.round(((revenue - prevRevenue) / prevRevenue) * 1000) / 10 : 0,
      expenseGrowth: prevExpenses > 0 ? Math.round(((expenses - prevExpenses) / prevExpenses) * 1000) / 10 : 0,
      expensesByCategory: expByCategory,
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
