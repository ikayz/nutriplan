const MealPlan = require('../models/MealPlan');

// @desc    Get user's meal plans for a range (or all)
// @route   GET /api/mealplans
// @access  Private
const getMealPlans = async (req, res) => {
  try {
    const mealPlans = await MealPlan.find({ user: req.user.id })
      .populate('meals.breakfast.recipe')
      .populate('meals.lunch.recipe')
      .populate('meals.dinner.recipe')
      .populate('meals.snack.recipe');

    res.status(200).json({ success: true, count: mealPlans.length, data: mealPlans });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user's meal plan for a specific date (YYYY-MM-DD)
// @route   GET /api/mealplans/:date
// @access  Private
const getMealPlanByDate = async (req, res) => {
  try {
    const { date } = req.params;

    let mealPlan = await MealPlan.findOne({ user: req.user.id, date })
      .populate('meals.breakfast.recipe')
      .populate('meals.lunch.recipe')
      .populate('meals.dinner.recipe')
      .populate('meals.snack.recipe');

    if (!mealPlan) {
      // Return a blank structure so the frontend can work with it cleanly
      return res.status(200).json({
        success: true,
        data: {
          date,
          meals: { breakfast: [], lunch: [], dinner: [], snack: [] }
        }
      });
    }

    res.status(200).json({ success: true, data: mealPlan });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create or update a meal plan for a specific date (YYYY-MM-DD)
// @route   POST /api/mealplans
// @access  Private
const updateMealPlan = async (req, res) => {
  try {
    const { date, meals } = req.body;

    if (!date) {
      return res.status(400).json({ success: false, message: 'Please provide a date' });
    }

    // Prepare update data
    const mealPlanFields = {
      user: req.user.id,
      date,
      meals: meals || { breakfast: [], lunch: [], dinner: [], snack: [] }
    };

    // Find and update or insert if doesn't exist
    const mealPlan = await MealPlan.findOneAndUpdate(
      { user: req.user.id, date },
      { $set: mealPlanFields },
      { new: true, upsert: true, runValidators: true }
    )
      .populate('meals.breakfast.recipe')
      .populate('meals.lunch.recipe')
      .populate('meals.dinner.recipe')
      .populate('meals.snack.recipe');

    res.status(200).json({ success: true, data: mealPlan });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a meal plan for a specific date
// @route   DELETE /api/mealplans/:date
// @access  Private
const deleteMealPlan = async (req, res) => {
  try {
    const { date } = req.params;

    await MealPlan.findOneAndDelete({ user: req.user.id, date });

    res.status(200).json({ success: true, message: 'Meal plan deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getMealPlans,
  getMealPlanByDate,
  updateMealPlan,
  deleteMealPlan
};
