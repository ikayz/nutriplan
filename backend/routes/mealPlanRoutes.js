const express = require('express');
const router = express.Router();
const {
  getMealPlans,
  getMealPlanByDate,
  updateMealPlan,
  deleteMealPlan
} = require('../controllers/mealPlanController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // Secure all meal plan routes

router.route('/')
  .get(getMealPlans)
  .post(updateMealPlan);

router.route('/:date')
  .get(getMealPlanByDate)
  .delete(deleteMealPlan);

module.exports = router;
