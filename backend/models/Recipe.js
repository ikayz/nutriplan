const mongoose = require('mongoose');

const RecipeSchema = new mongoose.Schema({
  spoonacularId: {
    type: Number,
    unique: true,
    sparse: true // Allows multiple custom recipes to have no spoonacularId
  },
  title: {
    type: String,
    required: [true, 'Please add a recipe title']
  },
  image: {
    type: String,
    default: ''
  },
  readyInMinutes: {
    type: Number,
    default: 0
  },
  servings: {
    type: Number,
    default: 1
  },
  sourceUrl: {
    type: String,
    default: ''
  },
  summary: {
    type: String,
    default: ''
  },
  extendedIngredients: [{
    name: { type: String, required: true },
    amount: { type: Number, default: 0 },
    unit: { type: String, default: '' },
    originalString: { type: String }
  }],
  analyzedInstructions: [{
    step: { type: Number },
    instruction: { type: String }
  }],
  nutrition: {
    calories: { type: Number, default: 0 },
    protein: { type: String, default: '0g' },
    carbs: { type: String, default: '0g' },
    fat: { type: String, default: '0g' }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // null if cached from Spoonacular
  },
  isCustom: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Recipe', RecipeSchema);
