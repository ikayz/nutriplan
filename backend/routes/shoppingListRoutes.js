const express = require('express');
const router = express.Router();
const {
  getShoppingList,
  addShoppingListItem,
  updateShoppingListItem,
  deleteShoppingListItem,
  clearCompletedItems,
  generateFromMealPlans
} = require('../controllers/shoppingListController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // Secure all shopping list routes

router.route('/')
  .get(getShoppingList)
  .post(addShoppingListItem);

router.post('/clear-completed', clearCompletedItems);
router.post('/generate', generateFromMealPlans);

router.route('/:id')
  .put(updateShoppingListItem)
  .delete(deleteShoppingListItem);

module.exports = router;
