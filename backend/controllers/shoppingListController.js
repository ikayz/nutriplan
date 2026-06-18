const ShoppingList = require('../models/ShoppingList');
const MealPlan = require('../models/MealPlan');
const Recipe = require('../models/Recipe');

// @desc    Get user's shopping list
// @route   GET /api/shoppinglist
// @access  Private
const getShoppingList = async (req, res) => {
  try {
    const list = await ShoppingList.find({ user: req.user.id })
      .sort({ category: 1, name: 1 }); // Group by category, then sort alphabetically

    res.status(200).json({ success: true, count: list.length, data: list });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add manual item to shopping list
// @route   POST /api/shoppinglist
// @access  Private
const addShoppingListItem = async (req, res) => {
  try {
    const { name, quantity, unit, category } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Please add an item name' });
    }

    const item = await ShoppingList.create({
      user: req.user.id,
      name,
      quantity: quantity || 1,
      unit: unit || '',
      category: category || 'Other'
    });

    res.status(201).json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update shopping list item (quantity, unit, completed state)
// @route   PUT /api/shoppinglist/:id
// @access  Private
const updateShoppingListItem = async (req, res) => {
  try {
    const { name, quantity, unit, category, completed } = req.body;
    let item = await ShoppingList.findOne({ _id: req.params.id, user: req.user.id });

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    if (name !== undefined) item.name = name;
    if (quantity !== undefined) item.quantity = quantity;
    if (unit !== undefined) item.unit = unit;
    if (category !== undefined) item.category = category;
    if (completed !== undefined) item.completed = completed;

    await item.save();

    res.status(200).json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete shopping list item
// @route   DELETE /api/shoppinglist/:id
// @access  Private
const deleteShoppingListItem = async (req, res) => {
  try {
    const item = await ShoppingList.findOneAndDelete({ _id: req.params.id, user: req.user.id });

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    res.status(200).json({ success: true, message: 'Item removed from list' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Clear all checked (completed) items
// @route   POST /api/shoppinglist/clear-completed
// @access  Private
const clearCompletedItems = async (req, res) => {
  try {
    await ShoppingList.deleteMany({ user: req.user.id, completed: true });
    res.status(200).json({ success: true, message: 'Cleared completed items' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Generate shopping list from all user meal plans
// @route   POST /api/shoppinglist/generate
// @access  Private
const generateFromMealPlans = async (req, res) => {
  try {
    // 1. Get all meal plans for user
    const mealPlans = await MealPlan.find({ user: req.user.id });

    if (!mealPlans || mealPlans.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No meal plans found. Add meals to your meal plan first!'
      });
    }

    // 2. Extract recipe IDs and custom meal names from all plans
    const recipeIds = new Set();
    const customMeals = []; // { name, count } for custom meals without recipes

    mealPlans.forEach(plan => {
      const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
      mealTypes.forEach(type => {
        if (plan.meals[type]) {
          plan.meals[type].forEach(item => {
            if (item.recipe) {
              recipeIds.add(item.recipe.toString());
            } else if (item.customMealName) {
              // Custom meal — track it for the shopping list
              customMeals.push({
                name: item.customMealName.replace(/^\[USDA\]\s*/i, ''), // strip USDA prefix
                date: plan.date,
                mealType: type
              });
            }
          });
        }
      });
    });

    const hasRecipes = recipeIds.size > 0;
    const hasCustomMeals = customMeals.length > 0;

    if (!hasRecipes && !hasCustomMeals) {
      return res.status(400).json({
        success: false,
        message: 'Your meal plans are empty. Add recipes or custom meals first!'
      });
    }

    // 3. Aggregate ingredients from recipes
    const ingredientAggregation = {};

    if (hasRecipes) {
      const recipes = await Recipe.find({ _id: { $in: Array.from(recipeIds) } });

      recipes.forEach(recipe => {
        if (recipe.extendedIngredients) {
          recipe.extendedIngredients.forEach(ing => {
            const name = ing.name.toLowerCase().trim();
            const unit = (ing.unit || '').toLowerCase().trim();
            const amount = ing.amount || 0;
            
            // Basic category sorting guesses
            let category = 'Other';
            const nameLower = name.toLowerCase();

            if (/(apple|banana|berry|lemon|lime|orange|grape|avocado|tomato|lettuce|spinach|kale|cucumber|pepper|onion|garlic|carrot|potato|broccoli|herb|cilantro|parsley)/.test(nameLower)) {
              category = 'Produce';
            } else if (/(milk|cheese|yogurt|butter|cream|feta|parmesan)/.test(nameLower)) {
              category = 'Dairy';
            } else if (/(chicken|turkey|beef|steak|pork|salmon|shrimp|fish|tuna|bacon|egg)/.test(nameLower)) {
              category = 'Meat & Seafood';
            } else if (/(oil|vinegar|sauce|spice|salt|pepper|oregano|paprika|chia|sugar|flour|quinoa|rice|bread|toast|pasta|can)/.test(nameLower)) {
              category = 'Pantry & Grains';
            }

            const aggKey = `${name}|${unit}`;
            if (ingredientAggregation[aggKey]) {
              ingredientAggregation[aggKey].quantity += amount;
            } else {
              ingredientAggregation[aggKey] = {
                name: ing.name, // keep original capitalization
                quantity: amount,
                unit: ing.unit,
                category
              };
            }
          });
        }
      });
    }

    // 4. Aggregate custom meals as individual shopping list items
    //    Group duplicates by name (case-insensitive) and count occurrences
    const customMealAgg = {};
    customMeals.forEach(meal => {
      const key = meal.name.toLowerCase().trim();
      if (customMealAgg[key]) {
        customMealAgg[key].count += 1;
      } else {
        customMealAgg[key] = {
          name: meal.name,
          count: 1
        };
      }
    });

    // 5. Clear user's current shopping list before generating fresh items
    await ShoppingList.deleteMany({ user: req.user.id });

    // 6. Build items to insert — recipe ingredients + custom meals
    const itemsToInsert = Object.values(ingredientAggregation).map(item => ({
      user: req.user.id,
      name: item.name,
      quantity: Number(item.quantity.toFixed(1)),
      unit: item.unit,
      category: item.category,
      completed: false
    }));

    // Add custom meals as items (category: "Meal Prep / Custom")
    Object.values(customMealAgg).forEach(meal => {
      itemsToInsert.push({
        user: req.user.id,
        name: meal.name,
        quantity: meal.count,
        unit: meal.count > 1 ? 'servings' : 'serving',
        category: 'Meal Prep / Custom',
        completed: false
      });
    });

    let createdItems = [];
    if (itemsToInsert.length > 0) {
      createdItems = await ShoppingList.insertMany(itemsToInsert);
    }

    // Build a helpful summary message
    const recipeIngCount = Object.keys(ingredientAggregation).length;
    const customCount = Object.keys(customMealAgg).length;
    let message = `Shopping list generated with ${createdItems.length} items`;
    if (recipeIngCount > 0 && customCount > 0) {
      message += ` (${recipeIngCount} recipe ingredients + ${customCount} custom meals)`;
    } else if (recipeIngCount > 0) {
      message += ` from recipe ingredients`;
    } else {
      message += ` from custom meals`;
    }
    message += '.';

    res.status(200).json({
      success: true,
      message,
      data: createdItems
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getShoppingList,
  addShoppingListItem,
  updateShoppingListItem,
  deleteShoppingListItem,
  clearCompletedItems,
  generateFromMealPlans
};
