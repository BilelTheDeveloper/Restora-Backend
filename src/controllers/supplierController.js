import Supplier from '../models/Supplier.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import Ingredient from '../models/Ingredient.js';
import { success, created } from '../utils/apiResponse.js';

export const getSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find({ restaurant: req.user.restaurant }).sort({ name: 1 });
    success(res, suppliers);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const createSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.create({ ...req.body, restaurant: req.user.restaurant });
    created(res, supplier);
  } catch (err) { res.status(400).json({ message: err.message }); }
};

export const updateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findOneAndUpdate(
      { _id: req.params.id, restaurant: req.user.restaurant },
      req.body, { new: true, runValidators: true }
    );
    if (!supplier) return res.status(404).json({ message: 'Supplier not found' });
    success(res, supplier);
  } catch (err) { res.status(400).json({ message: err.message }); }
};

export const deleteSupplier = async (req, res) => {
  try {
    await Supplier.findOneAndDelete({ _id: req.params.id, restaurant: req.user.restaurant });
    success(res, { deleted: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const getPurchaseOrders = async (req, res) => {
  try {
    const { status, supplier } = req.query;
    const filter = { restaurant: req.user.restaurant };
    if (status) filter.status = status;
    if (supplier) filter.supplier = supplier;
    const orders = await PurchaseOrder.find(filter)
      .populate('supplier', 'name phone email')
      .populate('items.ingredient', 'name unit')
      .sort({ createdAt: -1 })
      .limit(200);
    success(res, orders);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const createPurchaseOrder = async (req, res) => {
  try {
    const po = await PurchaseOrder.create({ ...req.body, restaurant: req.user.restaurant, createdBy: req.user._id });
    await po.populate('supplier', 'name phone email');
    await Supplier.findByIdAndUpdate(po.supplier._id, { $inc: { totalOrders: 1, totalSpend: po.total }, lastOrderDate: new Date() });
    created(res, po);
  } catch (err) { res.status(400).json({ message: err.message }); }
};

export const updatePurchaseOrder = async (req, res) => {
  try {
    const po = await PurchaseOrder.findOneAndUpdate(
      { _id: req.params.id, restaurant: req.user.restaurant },
      req.body, { new: true, runValidators: true }
    ).populate('supplier', 'name phone email');
    if (!po) return res.status(404).json({ message: 'Purchase order not found' });
    if (req.body.status === 'received') {
      for (const item of po.items) {
        if (item.ingredient) {
          await Ingredient.findByIdAndUpdate(item.ingredient, { $inc: { currentStock: item.receivedQuantity || item.quantity } });
        }
      }
    }
    success(res, po);
  } catch (err) { res.status(400).json({ message: err.message }); }
};

export const getReplenishmentSuggestions = async (req, res) => {
  try {
    const ingredients = await Ingredient.find({
      restaurant: req.user.restaurant,
      $expr: { $lte: ['$currentStock', { $multiply: ['$minStock', 1.5] }] },
    }).sort({ currentStock: 1 });
    const suggestions = ingredients.map(ing => {
      const neededQty = Math.max(ing.minStock * 3 - ing.currentStock, ing.minStock);
      return {
        ingredient: { _id: ing._id, name: ing.name, unit: ing.unit, currentStock: ing.currentStock, minStock: ing.minStock },
        suggestedQty: Math.ceil(neededQty),
        estimatedCost: Math.ceil(neededQty) * ing.costPerUnit,
        urgency: ing.currentStock <= 0 ? 'critical' : ing.currentStock <= ing.minStock ? 'high' : 'medium',
      };
    });
    success(res, { suggestions, totalEstimatedCost: suggestions.reduce((s, i) => s + i.estimatedCost, 0) });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const getPurchaseStats = async (req, res) => {
  try {
    const rid = req.user.restaurant;
    const thirtyAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [total, pending, monthlyAgg, topSupplier] = await Promise.all([
      PurchaseOrder.countDocuments({ restaurant: rid }),
      PurchaseOrder.countDocuments({ restaurant: rid, status: { $in: ['draft', 'sent', 'confirmed', 'partial'] } }),
      PurchaseOrder.aggregate([
        { $match: { restaurant: rid, createdAt: { $gte: thirtyAgo }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      PurchaseOrder.aggregate([
        { $match: { restaurant: rid, createdAt: { $gte: thirtyAgo } } },
        { $group: { _id: '$supplier', total: { $sum: '$total' } } },
        { $sort: { total: -1 } },
        { $limit: 1 },
        { $lookup: { from: 'suppliers', localField: '_id', foreignField: '_id', as: 'supplier' } },
        { $unwind: '$supplier' },
      ]),
    ]);
    success(res, {
      totalOrders: total,
      pendingOrders: pending,
      monthlySpend: monthlyAgg[0]?.total || 0,
      topSupplier: topSupplier[0] ? { name: topSupplier[0].supplier.name, spend: topSupplier[0].total } : null,
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
