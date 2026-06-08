require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Recipe = require('./models/Recipe');
const MealPlan = require('./models/MealPlan');
const ShoppingList = require('./models/ShoppingList');
const { MOCK_RECIPES } = require('./controllers/recipeController');

const seedData = async () => {
  try {
    // Connect to Database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nutriplan');
    console.log('MongoDB Connected for Seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Recipe.deleteMany({});
    await MealPlan.deleteMany({});
    await ShoppingList.deleteMany({});
    console.log('Database cleared of existing records.');

    // 1. Insert Mock Recipes to Database
    const createdRecipes = await Recipe.insertMany(MOCK_RECIPES);
    console.log(`Successfully seeded ${createdRecipes.length} recipes.`);

    // 2. Create Sample User (Password gets automatically hashed by pre-save schema middleware)
    const user = await User.create({
      username: 'test_user',
      email: 'user@example.com',
      password: 'password123',
      preferences: {
        diet: 'Vegetarian',
        calorieGoal: 2000,
        proteinGoal: 110,
        carbsGoal: 220,
        fatGoal: 65
      },
      savedRecipes: [createdRecipes[0]._id, createdRecipes[1]._id] // avocado toast & chickpea salad
    });
    console.log(`Successfully seeded sample user: ${user.email} (password: password123)`);

    // Get today's date in YYYY-MM-DD
    const todayStr = new Date().toISOString().split('T')[0];

    // Get tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // 3. Create Sample Meal Plans
    await MealPlan.create([
      {
        user: user._id,
        date: todayStr,
        meals: {
          breakfast: [{ recipe: createdRecipes[0]._id, calories: 320 }], // Avocado Toast
          lunch: [{ recipe: createdRecipes[1]._id, calories: 410 }], // Chickpea Salad
          dinner: [{ customMealName: 'Custom Veggie Stir Fry', calories: 450 }],
          snack: [{ recipe: createdRecipes[3]._id, calories: 290 }] // Berry Smoothie
        }
      },
      {
        user: user._id,
        date: tomorrowStr,
        meals: {
          breakfast: [{ recipe: createdRecipes[3]._id, calories: 290 }], // Berry Smoothie
          lunch: [{ recipe: createdRecipes[1]._id, calories: 410 }], // Chickpea Salad
          dinner: [{ customMealName: 'Baked Tofu & Asparagus', calories: 380 }],
          snack: []
        }
      }
    ]);
    console.log('Successfully seeded meal plans for today and tomorrow.');

    // 4. Create Sample Shopping List Items
    await ShoppingList.create([
      {
        user: user._id,
        name: 'Organic Haas Avocados',
        quantity: 3,
        unit: 'pcs',
        category: 'Produce',
        completed: false
      },
      {
        user: user._id,
        name: 'Whole Grain Sourdough Bread',
        quantity: 1,
        unit: 'loaf',
        category: 'Pantry & Grains',
        completed: false
      },
      {
        user: user._id,
        name: 'Greek Yogurt (Plain, Nonfat)',
        quantity: 32,
        unit: 'oz',
        category: 'Dairy',
        completed: true
      },
      {
        user: user._id,
        name: 'Frozen Strawberries',
        quantity: 1,
        unit: 'bag',
        category: 'Produce',
        completed: false
      }
    ]);
    console.log('Successfully seeded shopping list items.');

    console.log('Database Seeding Completed Successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed with error:', error.message);
    process.exit(1);
  }
};

seedData();
