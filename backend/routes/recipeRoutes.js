const express = require('express');
const router = express.Router();
const {
  searchRecipes,
  getRecipeDetails,
  getSavedRecipes,
  saveRecipe,
  unsaveRecipe,
  createCustomRecipe
} = require('../controllers/recipeController');
const { protect } = require('../middleware/authMiddleware');

router.get('/search', searchRecipes);
router.get('/saved', protect, getSavedRecipes);
router.post('/save', protect, saveRecipe);
router.delete('/saved/:id', protect, unsaveRecipe);
router.post('/custom', protect, createCustomRecipe);
router.get('/:id', getRecipeDetails);

module.exports = router;
