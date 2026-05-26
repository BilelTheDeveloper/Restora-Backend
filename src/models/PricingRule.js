import mongoose from 'mongoose';

const PricingRuleSchema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  name: { type: String, required: true, trim: true },
  type: {
    type: String,
    enum: ['happy_hour', 'peak_surcharge', 'lunch_deal', 'low_occupancy', 'demand_based', 'loyalty', 'bulk', 'early_bird'],
    required: true,
  },
  isActive: { type: Boolean, default: true },
  trigger: {
    conditionType: { type: String, enum: ['time', 'occupancy', 'day_of_week', 'manual'], default: 'time' },
    startTime: String,
    endTime: String,
    days: [{ type: String, enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] }],
    minOccupancy: Number,
    maxOccupancy: Number,
  },
  action: {
    actionType: { type: String, enum: ['percent_off', 'percent_on', 'fixed_off', 'free_item'], default: 'percent_off' },
    value: { type: Number, default: 0 },
    freeItemId: mongoose.Schema.Types.ObjectId,
  },
  appliesTo: {
    scopeType: { type: String, enum: ['all', 'category', 'item'], default: 'all' },
    categories: [String],
    items: [mongoose.Schema.Types.ObjectId],
  },
  priority: { type: Number, default: 0 },
  validFrom: Date,
  validUntil: Date,
  usageCount: { type: Number, default: 0 },
  maxUsage: Number,
  description: String,
}, { timestamps: true });

PricingRuleSchema.index({ restaurant: 1, isActive: 1 });
PricingRuleSchema.index({ restaurant: 1, type: 1 });

export default mongoose.model('PricingRule', PricingRuleSchema);
