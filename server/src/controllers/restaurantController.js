import Restaurant from '../models/Restaurant.js';
import User from '../models/User.js';
import { success, created, paginated } from '../utils/apiResponse.js';

export const createRestaurant = async (req, res, next) => {
  try {
    const existing = await Restaurant.findOne({ owner: req.user._id });
    if (existing) {
      res.status(400);
      return next(new Error('You already own a restaurant'));
    }

    const slug = req.body.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const slugExists = await Restaurant.findOne({ slug });
    const finalSlug = slugExists ? `${slug}-${Date.now()}` : slug;

    const restaurant = await Restaurant.create({ ...req.body, slug: finalSlug, owner: req.user._id });

    await User.findByIdAndUpdate(req.user._id, { restaurant: restaurant._id, role: 'owner' });

    created(res, restaurant, 'Restaurant created successfully');
  } catch (err) {
    next(err);
  }
};

export const getMyRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) {
      res.status(404);
      return next(new Error('Restaurant not found'));
    }
    success(res, restaurant);
  } catch (err) {
    next(err);
  }
};

export const updateRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOneAndUpdate(
      { owner: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!restaurant) {
      res.status(404);
      return next(new Error('Restaurant not found'));
    }
    success(res, restaurant);
  } catch (err) {
    next(err);
  }
};

// Public discovery endpoints
export const getPublicRestaurants = async (req, res, next) => {
  try {
    const { city, cuisine, halal, delivery, search, page = 1, limit = 12 } = req.query;
    const query = { isActive: true, isVerified: true };

    if (city) query['address.city'] = new RegExp(city, 'i');
    if (cuisine) query.cuisine = { $in: [new RegExp(cuisine, 'i')] };
    if (halal === 'true') query.isHalal = true;
    if (delivery === 'true') query['settings.acceptsDelivery'] = true;
    if (search) query.name = new RegExp(search, 'i');

    const total = await Restaurant.countDocuments(query);
    const restaurants = await Restaurant.find(query)
      .select('name slug logo coverImage cuisine address rating reviewCount settings isHalal')
      .sort({ rating: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    paginated(res, restaurants, {
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      limit: Number(limit),
    });
  } catch (err) {
    next(err);
  }
};

export const getPublicRestaurantBySlug = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ slug: req.params.slug, isActive: true })
      .select('-subscription');
    if (!restaurant) {
      res.status(404);
      return next(new Error('Restaurant not found'));
    }
    success(res, restaurant);
  } catch (err) {
    next(err);
  }
};
