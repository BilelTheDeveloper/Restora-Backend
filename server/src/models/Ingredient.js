import mongoose from 'mongoose';

const ingredientSchema = new mongoose.Schema(
  {
    restaurant:    { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    name:          { type: String, required: true, trim: true },
    unit:          { type: String, required: true, enum: ['g', 'kg', 'ml', 'L', 'pcs', 'dozen', 'tbsp', 'tsp', 'cup'], default: 'g' },
    currentStock:  { type: Number, required: true, default: 0, min: 0 },
    minStock:      { type: Number, required: true, default: 0, min: 0 },
    costPerUnit:   { type: Number, required: true, default: 0, min: 0 },
    supplier:      { type: String, trim: true },
    category:      { type: String, enum: ['produce', 'meat', 'dairy', 'dry', 'beverages', 'spices', 'other'], default: 'other' },
    isActive:      { type: Boolean, default: true },
  },
  { timestamps: true }
);

ingredientSchema.index({ restaurant: 1, name: 1 });
ingredientSchema.index({ restaurant: 1, currentStock: 1 });

export default mongoose.model('Ingredient', ingredientSchema);
