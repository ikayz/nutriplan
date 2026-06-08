const mongoose = require('mongoose');

const MealPlanSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Date stored as YYYY-MM-DD string to prevent timezone shift issues on client
  date: {
    type: String,
    required: [true, 'Please add a date (YYYY-MM-DD)']
  },
  meals: {
    breakfast: [{
      recipe: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Recipe',
        default: null
      },
      customMealName: { type: String },
      calories: { type: Number, default: 0 }
    }],
    lunch: [{
      recipe: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Recipe',
        default: null
      },
      customMealName: { type: String },
      calories: { type: Number, default: 0 }
    }],
    dinner: [{
      recipe: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Recipe',
        default: null
      },
      customMealName: { type: String },
      calories: { type: Number, default: 0 }
    }],
    snack: [{
      recipe: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Recipe',
        default: null
      },
      customMealName: { type: String },
      calories: { type: Number, default: 0 }
    }]
  }
}, {
  timestamps: true
});

// Compound index to ensure unique meal plans per user per date
MealPlanSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('MealPlan', MealPlanSchema);
