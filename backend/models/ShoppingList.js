const mongoose = require('mongoose');

const ShoppingListSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Please add ingredient name'],
    trim: true
  },
  quantity: {
    type: Number,
    default: 1
  },
  unit: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    default: 'Other', // 'Produce', 'Dairy', 'Meat', 'Pantry', etc.
    trim: true
  },
  completed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ShoppingList', ShoppingListSchema);
