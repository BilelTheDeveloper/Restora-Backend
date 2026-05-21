import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema(
  {
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuCategory', required: true },
    name: { type: String, required: true, trim: true },
    nameAr: { type: String, trim: true },
    description: { type: String },
    image: { type: String },
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number },
    modifiers: [
      {
        name: String,
        required: { type: Boolean, default: false },
        multiSelect: { type: Boolean, default: false },
        options: [
          {
            name: String,
            price: { type: Number, default: 0 },
          },
        ],
      },
    ],
    tags: [{ type: String }],
    isAvailable: { type: Boolean, default: true },
    isPopular: { type: Boolean, default: false },
    preparationTime: { type: Number, default: 10 },
    calories: { type: Number },
    allergens: [{ type: String }],
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

menuItemSchema.index({ restaurant: 1, category: 1 });

export default mongoose.model('MenuItem', menuItemSchema);
