const express = require('express');
const router = express.Router();
const {
  searchFoodNutrition,
  getFoodNutritionDetails
} = require('../controllers/nutritionController');
const { protect } = require('../middleware/authMiddleware');

router.get('/search', protect, searchFoodNutrition);
router.get('/:id', protect, getFoodNutritionDetails);

module.exports = router;
