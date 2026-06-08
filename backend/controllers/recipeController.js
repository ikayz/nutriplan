const User = require('../models/User');
const Recipe = require('../models/Recipe');

// Comprehensive mock recipe database to serve as a robust fallback
const MOCK_RECIPES = [
  {
    spoonacularId: 101,
    title: 'Avocado Toast with Poached Egg',
    image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&auto=format&fit=crop&q=80',
    readyInMinutes: 15,
    servings: 1,
    sourceUrl: 'https://example.com/avocado-toast',
    summary: 'A simple, nutrient-dense breakfast featuring creamy avocado, crisp sourdough bread, and a perfectly poached egg.',
    extendedIngredients: [
      { name: 'sourdough bread', amount: 1, unit: 'slice', originalString: '1 slice of sourdough bread' },
      { name: 'avocado', amount: 0.5, unit: 'whole', originalString: '1/2 ripe Haas avocado' },
      { name: 'egg', amount: 1, unit: 'large', originalString: '1 large egg' },
      { name: 'cherry tomatoes', amount: 4, unit: 'pieces', originalString: '4 cherry tomatoes, halved' },
      { name: 'red pepper flakes', amount: 0.25, unit: 'tsp', originalString: 'A pinch of red pepper flakes' },
      { name: 'sea salt & black pepper', amount: 0.1, unit: 'pinch', originalString: 'Sea salt and black pepper to taste' }
    ],
    analyzedInstructions: [
      { step: 1, instruction: 'Toast the slice of sourdough bread until golden brown and crispy.' },
      { step: 2, instruction: 'In a small bowl, mash the avocado with sea salt, black pepper, and a squeeze of lemon juice if desired.' },
      { step: 3, instruction: 'Poach the egg: Bring a small pot of water to a gentle simmer, add a splash of vinegar, swirl the water, slide the egg in, and cook for 3 minutes. Remove with a slotted spoon.' },
      { step: 4, instruction: 'Spread the mashed avocado evenly over the toasted bread.' },
      { step: 5, instruction: 'Place the poached egg on top of the avocado, garnish with cherry tomatoes, red pepper flakes, and extra black pepper.' }
    ],
    nutrition: {
      calories: 320,
      protein: '14g',
      carbs: '22g',
      fat: '19g'
    }
  },
  {
    spoonacularId: 102,
    title: 'Mediterranean Chickpea Salad',
    image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&auto=format&fit=crop&q=80',
    readyInMinutes: 10,
    servings: 2,
    sourceUrl: 'https://example.com/chickpea-salad',
    summary: 'A refreshing, protein-packed vegetarian salad loaded with crisp cucumbers, juicy tomatoes, kalamata olives, and tangy feta cheese.',
    extendedIngredients: [
      { name: 'canned chickpeas', amount: 1, unit: 'can', originalString: '1 can (15 oz) chickpeas, rinsed and drained' },
      { name: 'cucumber', amount: 1, unit: 'medium', originalString: '1 medium cucumber, diced' },
      { name: 'cherry tomatoes', amount: 1, unit: 'cup', originalString: '1 cup cherry tomatoes, halved' },
      { name: 'feta cheese', amount: 0.5, unit: 'cup', originalString: '1/2 cup crumbled feta cheese' },
      { name: 'kalamata olives', amount: 0.25, unit: 'cup', originalString: '1/4 cup kalamata olives, sliced' },
      { name: 'olive oil', amount: 2, unit: 'tbsp', originalString: '2 tbsp extra virgin olive oil' },
      { name: 'lemon juice', amount: 1, unit: 'tbsp', originalString: '1 tbsp fresh lemon juice' },
      { name: 'dried oregano', amount: 1, unit: 'tsp', originalString: '1 tsp dried oregano' }
    ],
    analyzedInstructions: [
      { step: 1, instruction: 'Rinse and drain the canned chickpeas thoroughly.' },
      { step: 2, instruction: 'Chop the cucumber, tomatoes, and olives and add them to a large salad bowl.' },
      { step: 3, instruction: 'Add the chickpeas and crumbled feta cheese to the bowl.' },
      { step: 4, instruction: 'In a small cup, whisk together the olive oil, lemon juice, dried oregano, salt, and pepper.' },
      { step: 5, instruction: 'Pour the dressing over the salad, toss gently to combine, and serve cold.' }
    ],
    nutrition: {
      calories: 410,
      protein: '12g',
      carbs: '38g',
      fat: '24g'
    }
  },
  {
    spoonacularId: 103,
    title: 'Pan-Seared Garlic Butter Salmon',
    image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&auto=format&fit=crop&q=80',
    readyInMinutes: 20,
    servings: 2,
    sourceUrl: 'https://example.com/garlic-salmon',
    summary: 'Perfectly flaky salmon fillets seared in a rich, lemony garlic butter sauce. Keto-friendly and packed with healthy omega-3 fatty acids.',
    extendedIngredients: [
      { name: 'salmon fillets', amount: 2, unit: 'pieces', originalString: '2 salmon fillets (6 oz each)' },
      { name: 'butter', amount: 2, unit: 'tbsp', originalString: '2 tbsp unsalted butter' },
      { name: 'garlic', amount: 3, unit: 'cloves', originalString: '3 cloves garlic, minced' },
      { name: 'lemon juice', amount: 1.5, unit: 'tbsp', originalString: '1.5 tbsp fresh lemon juice' },
      { name: 'olive oil', amount: 1, unit: 'tbsp', originalString: '1 tbsp olive oil' },
      { name: 'fresh parsley', amount: 1, unit: 'tbsp', originalString: '1 tbsp chopped fresh parsley for garnish' },
      { name: 'salt and pepper', amount: 0.2, unit: 'pinch', originalString: 'Salt and pepper to taste' }
    ],
    analyzedInstructions: [
      { step: 1, instruction: 'Pat the salmon fillets dry with paper towels. Season both sides with salt and pepper.' },
      { step: 2, instruction: 'Heat olive oil and 1 tablespoon of butter in a large skillet over medium-high heat.' },
      { step: 3, instruction: 'Add salmon skin-side up and sear for 4-5 minutes until golden brown. Flip.' },
      { step: 4, instruction: 'Add the remaining butter, minced garlic, and lemon juice to the pan. Spoon the melted garlic butter over the salmon as it cooks for another 3-4 minutes.' },
      { step: 5, instruction: 'Remove salmon from the skillet. Pour excess garlic butter sauce over the fillets, garnish with parsley, and serve with lemon wedges.' }
    ],
    nutrition: {
      calories: 480,
      protein: '34g',
      carbs: '2g',
      fat: '36g'
    }
  },
  {
    spoonacularId: 104,
    title: 'Creamy Berry Protein Smoothie',
    image: 'https://images.unsplash.com/photo-1553530979-7ee52a2670c4?w=800&auto=format&fit=crop&q=80',
    readyInMinutes: 5,
    servings: 1,
    sourceUrl: 'https://example.com/berry-smoothie',
    summary: 'A quick, antioxidant-rich post-workout shake made with mixed berries, Greek yogurt, spinach, and vanilla whey protein.',
    extendedIngredients: [
      { name: 'frozen mixed berries', amount: 1, unit: 'cup', originalString: '1 cup frozen strawberries, blueberries, and raspberries' },
      { name: 'Greek yogurt', amount: 0.5, unit: 'cup', originalString: '1/2 cup plain nonfat Greek yogurt' },
      { name: 'vanilla protein powder', amount: 1, unit: 'scoop', originalString: '1 scoop vanilla whey or plant-based protein powder' },
      { name: 'almond milk', amount: 1, unit: 'cup', originalString: '1 cup unsweetened almond milk' },
      { name: 'spinach', amount: 1, unit: 'cup', originalString: '1 cup fresh baby spinach leaves' },
      { name: 'chia seeds', amount: 1, unit: 'tbsp', originalString: '1 tbsp chia seeds' }
    ],
    analyzedInstructions: [
      { step: 1, instruction: 'Add almond milk, Greek yogurt, and protein powder to your blender.' },
      { step: 2, instruction: 'Add the fresh baby spinach, chia seeds, and frozen mixed berries.' },
      { step: 3, instruction: 'Blend on high speed for 60-90 seconds until completely smooth and creamy. Add extra almond milk if it is too thick.' }
    ],
    nutrition: {
      calories: 290,
      protein: '28g',
      carbs: '28g',
      fat: '6g'
    }
  },
  {
    spoonacularId: 105,
    title: 'Grilled Chicken Quinoa Bowl',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop&q=80',
    readyInMinutes: 25,
    servings: 2,
    sourceUrl: 'https://example.com/chicken-quinoa-bowl',
    summary: 'A healthy grain bowl consisting of fluffy tri-color quinoa, sliced grilled chicken breast, roasted sweet potatoes, and a creamy tahini drizzle.',
    extendedIngredients: [
      { name: 'chicken breast', amount: 2, unit: 'fillets', originalString: '2 boneless chicken breasts (5 oz each)' },
      { name: 'quinoa', amount: 0.5, unit: 'cup', originalString: '1/2 cup dry quinoa (rinsed)' },
      { name: 'sweet potato', amount: 1, unit: 'medium', originalString: '1 sweet potato, peeled and cubed' },
      { name: 'olive oil', amount: 1.5, unit: 'tbsp', originalString: '1.5 tbsp olive oil' },
      { name: 'baby kale', amount: 2, unit: 'cups', originalString: '2 cups organic baby kale or spinach' },
      { name: 'tahini', amount: 2, unit: 'tbsp', originalString: '2 tbsp tahini' },
      { name: 'paprika & garlic powder', amount: 0.5, unit: 'tsp', originalString: '1/2 tsp each paprika and garlic powder' }
    ],
    analyzedInstructions: [
      { step: 1, instruction: 'Preheat oven to 400°F (200°C). Toss sweet potato cubes in 1/2 tbsp olive oil, salt, and paprika. Roast on a baking sheet for 20 minutes.' },
      { step: 2, instruction: 'Cook quinoa: In a small pot, combine quinoa and 1 cup of water. Bring to a boil, cover, reduce heat to low, and cook for 15 minutes. Let sit covered for 5 minutes, then fluff.' },
      { step: 3, instruction: 'Season chicken breast with garlic powder, salt, and pepper. Heat 1 tbsp olive oil in a grill pan over medium-high heat. Grill chicken for 6 minutes per side or until internal temp reaches 165°F. Rest and slice.' },
      { step: 4, instruction: 'Whisk tahini with 1 tbsp warm water, a squeeze of lemon juice, and a pinch of salt to make a smooth dressing.' },
      { step: 5, instruction: 'Assemble the bowl: Create a base of kale and quinoa, arrange sliced chicken and roasted sweet potatoes on top, and drizzle with the tahini dressing.' }
    ],
    nutrition: {
      calories: 520,
      protein: '38g',
      carbs: '46g',
      fat: '18g'
    }
  }
];

// Helper to filter mock recipes based on query, diet, calories
const queryMockRecipes = (query, diet, maxCalories) => {
  let results = [...MOCK_RECIPES];

  if (query) {
    const q = query.toLowerCase();
    results = results.filter(
      r => r.title.toLowerCase().includes(q) || r.summary.toLowerCase().includes(q)
    );
  }

  if (diet) {
    const d = diet.toLowerCase();
    // Veg/Vegan filters
    if (d === 'vegetarian') {
      results = results.filter(r => ['Avocado Toast with Poached Egg', 'Mediterranean Chickpea Salad', 'Creamy Berry Protein Smoothie'].includes(r.title));
    } else if (d === 'vegan') {
      results = results.filter(r => ['Creamy Berry Protein Smoothie'].includes(r.title)); // chia seeds/almond milk custom vegan version
    } else if (d === 'gluten free') {
      results = results.filter(r => ['Mediterranean Chickpea Salad', 'Pan-Seared Garlic Butter Salmon', 'Creamy Berry Protein Smoothie', 'Grilled Chicken Quinoa Bowl'].includes(r.title));
    }
  }

  if (maxCalories) {
    results = results.filter(r => r.nutrition.calories <= Number(maxCalories));
  }

  return results;
};

// @desc    Search recipes (Proxy to Spoonacular or Mock Fallback)
// @route   GET /api/recipes/search
// @access  Public
const searchRecipes = async (req, res) => {
  const { query, diet, maxCalories, number = 10 } = req.query;
  const apiKey = process.env.SPOONACULAR_API_KEY;

  // If no API Key configured, or it's a placeholder, use mock database
  if (!apiKey || apiKey === 'your_spoonacular_api_key_here') {
    console.log('Spoonacular API Key missing or placeholder. Using Mock Fallback.');
    const mockResults = queryMockRecipes(query, diet, maxCalories);
    return res.status(200).json({
      success: true,
      source: 'mock',
      results: mockResults.map(r => ({
        id: r.spoonacularId,
        title: r.title,
        image: r.image,
        readyInMinutes: r.readyInMinutes,
        servings: r.servings,
        nutrition: r.nutrition
      }))
    });
  }

  try {
    let url = `https://api.spoonacular.com/recipes/complexSearch?apiKey=${apiKey}&number=${number}&addRecipeNutrition=true`;
    if (query) url += `&query=${encodeURIComponent(query)}`;
    if (diet) url += `&diet=${encodeURIComponent(diet)}`;
    if (maxCalories) url += `&maxCalories=${maxCalories}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'failure' || !data.results) {
      throw new Error(data.message || 'Spoonacular search API failed');
    }

    const formattedResults = data.results.map(r => {
      // Find macronutrients from spoonacular nutrition object
      const nut = r.nutrition?.nutrients || [];
      const getNut = (name) => nut.find(n => n.name === name);
      return {
        id: r.id,
        title: r.title,
        image: r.image,
        readyInMinutes: r.readyInMinutes,
        servings: r.servings,
        nutrition: {
          calories: Math.round(getNut('Calories')?.amount || 0),
          protein: `${Math.round(getNut('Protein')?.amount || 0)}g`,
          carbs: `${Math.round(getNut('Carbohydrates')?.amount || 0)}g`,
          fat: `${Math.round(getNut('Fat')?.amount || 0)}g`
        }
      };
    });

    res.status(200).json({
      success: true,
      source: 'spoonacular',
      results: formattedResults
    });
  } catch (error) {
    console.error('Spoonacular search failed. Falling back to mock data. Error:', error.message);
    const mockResults = queryMockRecipes(query, diet, maxCalories);
    res.status(200).json({
      success: true,
      source: 'mock-fallback',
      results: mockResults.map(r => ({
        id: r.spoonacularId,
        title: r.title,
        image: r.image,
        readyInMinutes: r.readyInMinutes,
        servings: r.servings,
        nutrition: r.nutrition
      }))
    });
  }
};

// @desc    Get detailed recipe by ID (Spoonacular or Local DB)
// @route   GET /api/recipes/:id
// @access  Public
const getRecipeDetails = async (req, res) => {
  const { id } = req.params;

  // Check if ID is a custom database ID (non-numeric ObjectId)
  const isMongoId = /^[0-9a-fA-F]{24}$/.test(id);

  if (isMongoId) {
    try {
      const localRecipe = await Recipe.findById(id);
      if (!localRecipe) {
        return res.status(404).json({ success: false, message: 'Custom recipe not found' });
      }
      return res.status(200).json({ success: true, source: 'database', recipe: localRecipe });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  const numericId = Number(id);

  // Check if it's in the mock DB first
  const mockRecipe = MOCK_RECIPES.find(r => r.spoonacularId === numericId);

  const apiKey = process.env.SPOONACULAR_API_KEY;
  if (!apiKey || apiKey === 'your_spoonacular_api_key_here') {
    if (mockRecipe) {
      return res.status(200).json({ success: true, source: 'mock', recipe: mockRecipe });
    }
    return res.status(404).json({ success: false, message: 'Recipe not found in mock database' });
  }

  try {
    // Check if we have it cached in database
    const cachedRecipe = await Recipe.findOne({ spoonacularId: numericId });
    if (cachedRecipe) {
      return res.status(200).json({ success: true, source: 'database-cache', recipe: cachedRecipe });
    }

    // Call Spoonacular API
    const response = await fetch(`https://api.spoonacular.com/recipes/${numericId}/information?apiKey=${apiKey}&includeNutrition=true`);
    const data = await response.json();

    if (data.status === 'failure' || !data.title) {
      throw new Error(data.message || 'Spoonacular details API failed');
    }

    // Parse nutrition
    const nut = data.nutrition?.nutrients || [];
    const getNut = (name) => nut.find(n => n.name === name);

    const recipeData = {
      spoonacularId: data.id,
      title: data.title,
      image: data.image,
      readyInMinutes: data.readyInMinutes,
      servings: data.servings,
      sourceUrl: data.sourceUrl,
      summary: data.summary,
      extendedIngredients: data.extendedIngredients.map(i => ({
        name: i.name,
        amount: i.amount,
        unit: i.unit,
        originalString: i.original
      })),
      analyzedInstructions: data.analyzedInstructions?.[0]?.steps?.map(s => ({
        step: s.number,
        instruction: s.step
      })) || [],
      nutrition: {
        calories: Math.round(getNut('Calories')?.amount || 0),
        protein: `${Math.round(getNut('Protein')?.amount || 0)}g`,
        carbs: `${Math.round(getNut('Carbohydrates')?.amount || 0)}g`,
        fat: `${Math.round(getNut('Fat')?.amount || 0)}g`
      }
    };

    // Cache the recipe details in DB
    const newRecipe = await Recipe.create(recipeData);

    res.status(200).json({
      success: true,
      source: 'spoonacular-api',
      recipe: newRecipe
    });
  } catch (error) {
    console.error('Spoonacular details failed. Fallback to mock. Error:', error.message);
    if (mockRecipe) {
      return res.status(200).json({ success: true, source: 'mock-fallback', recipe: mockRecipe });
    }
    res.status(500).json({ success: false, message: 'Could not fetch recipe details from API or mock database.' });
  }
};

// @desc    Get all saved/favorite recipes for user
// @route   GET /api/recipes/saved
// @access  Private
const getSavedRecipes = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('savedRecipes');
    res.status(200).json({ success: true, data: user.savedRecipes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Save/favorite a recipe (and cache if from Spoonacular)
// @route   POST /api/recipes/save
// @access  Private
const saveRecipe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const { spoonacularId, title, image, readyInMinutes, servings, sourceUrl, summary, extendedIngredients, analyzedInstructions, nutrition } = req.body;

    let recipe;

    if (spoonacularId) {
      // Spoonacular recipe: Check if it's already in the Recipe collection
      recipe = await Recipe.findOne({ spoonacularId });

      if (!recipe) {
        // Create in Recipe cache database
        recipe = await Recipe.create({
          spoonacularId,
          title,
          image,
          readyInMinutes,
          servings,
          sourceUrl,
          summary,
          extendedIngredients,
          analyzedInstructions,
          nutrition
        });
      }
    } else {
      // Custom user recipe (already created or being created)
      recipe = await Recipe.create({
        title,
        image,
        readyInMinutes,
        servings,
        sourceUrl,
        summary,
        extendedIngredients,
        analyzedInstructions,
        nutrition,
        createdBy: req.user.id,
        isCustom: true
      });
    }

    // Check if recipe is already saved in User's list
    if (user.savedRecipes.includes(recipe._id)) {
      return res.status(400).json({ success: false, message: 'Recipe already saved' });
    }

    user.savedRecipes.push(recipe._id);
    await user.save();

    res.status(200).json({ success: true, message: 'Recipe saved successfully', data: recipe });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Unsave a recipe
// @route   DELETE /api/recipes/saved/:id
// @access  Private
const unsaveRecipe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const recipeId = req.params.id;

    if (!user.savedRecipes.includes(recipeId)) {
      return res.status(404).json({ success: false, message: 'Recipe not found in saved list' });
    }

    user.savedRecipes = user.savedRecipes.filter(id => id.toString() !== recipeId);
    await user.save();

    res.status(200).json({ success: true, message: 'Recipe unsaved successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a custom recipe
// @route   POST /api/recipes/custom
// @access  Private
const createCustomRecipe = async (req, res) => {
  try {
    const { title, image, readyInMinutes, servings, extendedIngredients, analyzedInstructions, nutrition } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Please add a title' });
    }

    const customRecipe = await Recipe.create({
      title,
      image: image || 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&auto=format&fit=crop&q=80',
      readyInMinutes: readyInMinutes || 0,
      servings: servings || 1,
      extendedIngredients: extendedIngredients || [],
      analyzedInstructions: analyzedInstructions || [],
      nutrition: nutrition || { calories: 0, protein: '0g', carbs: '0g', fat: '0g' },
      createdBy: req.user.id,
      isCustom: true
    });

    // Automatically save to user's saved list
    const user = await User.findById(req.user.id);
    user.savedRecipes.push(customRecipe._id);
    await user.save();

    res.status(201).json({ success: true, data: customRecipe });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  searchRecipes,
  getRecipeDetails,
  getSavedRecipes,
  saveRecipe,
  unsaveRecipe,
  createCustomRecipe,
  MOCK_RECIPES
};
