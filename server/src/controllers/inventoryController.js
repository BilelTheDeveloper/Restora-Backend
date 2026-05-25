import Ingredient from '../models/Ingredient.js';
import Recipe from '../models/Recipe.js';
import Order from '../models/Order.js';
import { success, created } from '../utils/apiResponse.js';

// ── Ingredients ────────────────────────────────────────────────
export const getIngredients = async (req, res, next) => {
  try {
    const { category, lowStock } = req.query;
    const filter = { restaurant: req.user.restaurant, isActive: true };
    if (category) filter.category = category;
    if (lowStock === 'true') filter.$expr = { $lte: ['$currentStock', '$minStock'] };

    const ingredients = await Ingredient.find(filter).sort({ name: 1 });
    success(res, ingredients);
  } catch (err) {
    next(err);
  }
};

export const createIngredient = async (req, res, next) => {
  try {
    const { name, unit, currentStock, minStock, costPerUnit, supplier, category } = req.body;
    if (!name?.trim()) { res.status(400); return next(new Error('Name required')); }

    const ingredient = await Ingredient.create({
      restaurant: req.user.restaurant,
      name: name.trim(), unit, currentStock, minStock, costPerUnit, supplier, category,
    });
    created(res, ingredient);
  } catch (err) {
    next(err);
  }
};

export const updateIngredient = async (req, res, next) => {
  try {
    const allowed = ['name', 'unit', 'currentStock', 'minStock', 'costPerUnit', 'supplier', 'category', 'isActive'];
    const update = {};
    for (const k of allowed) if (req.body[k] !== undefined) update[k] = req.body[k];

    const ingredient = await Ingredient.findOneAndUpdate(
      { _id: req.params.id, restaurant: req.user.restaurant },
      update, { new: true }
    );
    if (!ingredient) { res.status(404); return next(new Error('Ingredient not found')); }
    success(res, ingredient);
  } catch (err) {
    next(err);
  }
};

export const addStock = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity <= 0) { res.status(400); return next(new Error('Quantity must be positive')); }

    const ingredient = await Ingredient.findOneAndUpdate(
      { _id: req.params.id, restaurant: req.user.restaurant },
      { $inc: { currentStock: quantity } },
      { new: true }
    );
    if (!ingredient) { res.status(404); return next(new Error('Ingredient not found')); }
    success(res, ingredient);
  } catch (err) {
    next(err);
  }
};

export const deleteIngredient = async (req, res, next) => {
  try {
    await Ingredient.findOneAndUpdate(
      { _id: req.params.id, restaurant: req.user.restaurant },
      { isActive: false }
    );
    success(res, null, 'Ingredient deactivated');
  } catch (err) {
    next(err);
  }
};

// ── Recipes ────────────────────────────────────────────────────
export const getRecipes = async (req, res, next) => {
  try {
    const recipes = await Recipe.find({ restaurant: req.user.restaurant })
      .populate('ingredients.ingredient', 'name unit costPerUnit currentStock');
    success(res, recipes);
  } catch (err) {
    next(err);
  }
};

export const upsertRecipe = async (req, res, next) => {
  try {
    const { menuItemName, ingredients, notes } = req.body;
    if (!menuItemName?.trim()) { res.status(400); return next(new Error('Menu item name required')); }

    const recipe = await Recipe.findOneAndUpdate(
      { restaurant: req.user.restaurant, menuItemName: menuItemName.trim() },
      { $set: { ingredients: ingredients || [], notes } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).populate('ingredients.ingredient', 'name unit costPerUnit currentStock');

    success(res, recipe);
  } catch (err) {
    next(err);
  }
};

export const deleteRecipe = async (req, res, next) => {
  try {
    await Recipe.findOneAndDelete({ _id: req.params.id, restaurant: req.user.restaurant });
    success(res, null, 'Recipe deleted');
  } catch (err) {
    next(err);
  }
};

// ── Dish Margins ───────────────────────────────────────────────
export const getDishMargins = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days || '30', 10);
    const rid  = req.user.restaurant;
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const recipes = await Recipe.find({ restaurant: rid })
      .populate('ingredients.ingredient', 'name costPerUnit unit');

    const salesData = await Order.aggregate([
      { $match: { restaurant: rid, createdAt: { $gte: from } } },
      { $unwind: '$items' },
      { $group: {
        _id:     '$items.name',
        revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        count:   { $sum: '$items.quantity' },
        price:   { $first: '$items.price' },
      }},
    ]);

    const salesMap = Object.fromEntries(salesData.map(s => [s._id, s]));

    const margins = recipes.map(recipe => {
      const ingredientCost = recipe.ingredients.reduce((sum, ri) => {
        return sum + (ri.ingredient?.costPerUnit || 0) * ri.quantity;
      }, 0);

      const sales = salesMap[recipe.menuItemName] || { revenue: 0, count: 0, price: 0 };
      const costPerServing = ingredientCost / (recipe.yield || 1);
      const margin = sales.price > 0 ? ((sales.price - costPerServing) / sales.price) * 100 : null;

      return {
        menuItemName: recipe.menuItemName,
        ingredientCost: Math.round(costPerServing * 100) / 100,
        revenue:    Math.round(sales.revenue * 100) / 100,
        count:      sales.count,
        price:      sales.price,
        margin:     margin !== null ? Math.round(margin * 10) / 10 : null,
      };
    });

    success(res, margins);
  } catch (err) {
    next(err);
  }
};
