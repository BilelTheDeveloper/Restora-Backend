import Restaurant from '../models/Restaurant.js';
import User from '../models/User.js';
import { success, created, paginated } from '../utils/apiResponse.js';

// Whitelisted fields for restaurant create/update (prevents mass assignment)
const ALLOWED_FIELDS = [
  'name', 'description', 'cuisine', 'address', 'contact',
  'settings', 'logo', 'coverImage', 'socialMedia', 'isHalal',
  'tags', 'priceRange', 'openingHours',
  'template', 'menu', 'about', 'images', 'googleMapsLink',
  'vipService', 'isPublished',
];

const pickAllowed = (body) =>
  Object.fromEntries(Object.entries(body).filter(([k]) => ALLOWED_FIELDS.includes(k)));

// Escape regex special chars to prevent ReDoS
const escRe = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const createRestaurant = async (req, res, next) => {
  try {
    const existing = await Restaurant.findOne({ owner: req.user._id });
    if (existing) {
      res.status(400);
      return next(new Error('You already own a restaurant'));
    }

    const data = pickAllowed(req.body);
    const slug = (data.name || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const slugExists = await Restaurant.findOne({ slug });
    const finalSlug = slugExists ? `${slug}-${Date.now()}` : slug;

    const restaurant = await Restaurant.create({ ...data, slug: finalSlug, owner: req.user._id });

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
    const update = pickAllowed(req.body);
    const restaurant = await Restaurant.findOneAndUpdate(
      { owner: req.user._id },
      { $set: update },
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

export const upsertMyRestaurant = async (req, res, next) => {
  try {
    const data = pickAllowed(req.body);
    const existing = await Restaurant.findOne({ owner: req.user._id });

    if (existing) {
      const updated = await Restaurant.findOneAndUpdate(
        { owner: req.user._id },
        { $set: data },
        { new: true, runValidators: true }
      );
      return success(res, updated, 'Restaurant updated');
    }

    // Create — generate slug from name
    const base = (data.name || 'restaurant')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const slugExists = await Restaurant.findOne({ slug: base });
    const slug = slugExists ? `${base}-${Date.now()}` : base;

    const restaurant = await Restaurant.create({ ...data, slug, owner: req.user._id });
    await User.findByIdAndUpdate(req.user._id, { restaurant: restaurant._id });
    created(res, restaurant, 'Restaurant created');
  } catch (err) {
    next(err);
  }
};

// Public discovery endpoints
export const getPublicRestaurants = async (req, res, next) => {
  try {
    const { city, cuisine, halal, delivery, search, page = 1, limit = 12 } = req.query;
    const query = { isActive: true, isVerified: true };

    // Escape user input before using in RegExp (prevents ReDoS)
    if (city)    query['address.city'] = new RegExp(escRe(city), 'i');
    if (cuisine) query.cuisine = { $in: [new RegExp(escRe(cuisine), 'i')] };
    if (search)  query.name = new RegExp(escRe(search), 'i');
    if (halal === 'true') query.isHalal = true;
    if (delivery === 'true') query['settings.acceptsDelivery'] = true;

    const total = await Restaurant.countDocuments(query);
    const restaurants = await Restaurant.find(query)
      .select('name slug logo coverImage cuisine address rating reviewCount settings isHalal')
      .sort({ rating: -1 })
      .skip((page - 1) * limit)
      .limit(Math.min(Number(limit), 50)); // cap at 50

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
    if (!restaurant.isPublished) {
      return res.status(200).json({ success: true, data: null, unpublished: true });
    }
    success(res, restaurant);
  } catch (err) {
    next(err);
  }
};
