import mongoose from 'mongoose';

const recipeIngredientSchema = new mongoose.Schema({
  ingredient: { type: mongoose.Schema.Types.ObjectId, ref: 'Ingredient', required: true },
  quantity:   { type: Number, required: true, min: 0 },
}, { _id: false });

const recipeSchema = new mongoose.Schema(
  {
    restaurant:    { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    menuItemName:  { type: String, required: true, trim: true },
    ingredients:   [recipeIngredientSchema],
    yield:         { type: Number, default: 1 },
    notes:         { type: String },
  },
  { timestamps: true }
);

recipeSchema.index({ restaurant: 1, menuItemName: 1 });

export default mongoose.model('Recipe', recipeSchema);
