// USDA FoodData Central API Proxy and Fallback
const MOCK_FOODS = [
  {
    fdcId: 'apple',
    description: 'Apple (Raw, with skin)',
    brandOwner: 'Natural Fruit',
    servingSize: 100,
    servingSizeUnit: 'g',
    nutrition: {
      calories: 52,
      protein: 0.3,
      fat: 0.2,
      carbs: 14
    }
  },
  {
    fdcId: 'banana',
    description: 'Banana (Raw)',
    brandOwner: 'Natural Fruit',
    servingSize: 100,
    servingSizeUnit: 'g',
    nutrition: {
      calories: 89,
      protein: 1.1,
      fat: 0.3,
      carbs: 23
    }
  },
  {
    fdcId: 'chicken_breast',
    description: 'Chicken Breast (Boneless, Skinless, Grilled)',
    brandOwner: 'Fresh Poultry',
    servingSize: 100,
    servingSizeUnit: 'g',
    nutrition: {
      calories: 165,
      protein: 31,
      fat: 3.6,
      carbs: 0
    }
  },
  {
    fdcId: 'brown_rice',
    description: 'Brown Rice (Cooked, Medium-grain)',
    brandOwner: 'Healthy Grains',
    servingSize: 100,
    servingSizeUnit: 'g',
    nutrition: {
      calories: 112,
      protein: 2.6,
      fat: 0.9,
      carbs: 24
    }
  },
  {
    fdcId: 'whole_egg',
    description: 'Whole Egg (Large, Boiled)',
    brandOwner: 'Farm Fresh',
    servingSize: 50,
    servingSizeUnit: 'g',
    nutrition: {
      calories: 78,
      protein: 6.3,
      fat: 5.3,
      carbs: 0.6
    }
  },
  {
    fdcId: 'sweet_potato',
    description: 'Sweet Potato (Baked in skin)',
    brandOwner: 'Natural Root',
    servingSize: 100,
    servingSizeUnit: 'g',
    nutrition: {
      calories: 90,
      protein: 2,
      fat: 0.2,
      carbs: 21
    }
  },
  {
    fdcId: 'almonds',
    description: 'Almonds (Raw, Whole)',
    brandOwner: 'Nut Tree',
    servingSize: 28,
    servingSizeUnit: 'g',
    nutrition: {
      calories: 164,
      protein: 6,
      fat: 14,
      carbs: 6
    }
  },
  {
    fdcId: 'spinach',
    description: 'Spinach (Raw, Baby leaves)',
    brandOwner: 'Organic Greens',
    servingSize: 100,
    servingSizeUnit: 'g',
    nutrition: {
      calories: 23,
      protein: 2.9,
      fat: 0.4,
      carbs: 3.6
    }
  }
];

// @desc    Search food items in USDA database
// @route   GET /api/nutrition/search
// @access  Private
const searchFoodNutrition = async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ success: false, message: 'Please provide a search query' });
  }

  const apiKey = process.env.USDA_API_KEY;

  // Use mock fallback if api key is default or missing
  if (!apiKey || apiKey === 'DEMO_KEY' || apiKey === 'your_usda_api_key_here') {
    console.log('USDA API Key missing or using Demo/Placeholder. Serving Mock Fallback.');
    const q = query.toLowerCase();
    const results = MOCK_FOODS.filter(
      f => f.description.toLowerCase().includes(q)
    );
    return res.status(200).json({ success: true, source: 'mock', results });
  }

  try {
    const response = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${apiKey}&query=${encodeURIComponent(query)}&pageSize=10`);
    const data = await response.json();

    if (!response.ok || data.error) {
      throw new Error(data.error?.message || `USDA API returned status ${response.status}`);
    }

    if (!data.foods || data.foods.length === 0) {
      return res.status(200).json({ success: true, source: 'usda-api', results: [] });
    }

    const formattedResults = data.foods.map(f => {
      const getNutrient = (id) => {
        if (!f.foodNutrients || !Array.isArray(f.foodNutrients)) return 0;
        const nut = f.foodNutrients.find(n => n.nutrientId === id || n.nutrientNumber === String(id));
        return nut && typeof nut.value !== 'undefined' && nut.value !== null ? Number(nut.value) : 0;
      };

      // USDA typical ids: Calories (1008), Protein (1003), Fat (1004), Carbs (1005)
      return {
        fdcId: String(f.fdcId),
        description: f.description,
        brandOwner: f.brandOwner || 'Generic / USDA',
        servingSize: f.servingSize || 100,
        servingSizeUnit: f.servingSizeUnit || 'g',
        nutrition: {
          calories: Math.round(getNutrient(1008)),
          protein: Number(getNutrient(1003).toFixed(1)),
          fat: Number(getNutrient(1004).toFixed(1)),
          carbs: Number(getNutrient(1005).toFixed(1))
        }
      };
    });

    res.status(200).json({
      success: true,
      source: 'usda-api',
      results: formattedResults
    });
  } catch (error) {
    console.error('USDA Search API failed. Falling back to mock data. Error:', error.message);
    const q = query.toLowerCase();
    const results = MOCK_FOODS.filter(
      f => f.description.toLowerCase().includes(q)
    );
    res.status(200).json({ success: true, source: 'mock-fallback', results });
  }
};

// @desc    Get detailed food item by ID
// @route   GET /api/nutrition/:id
// @access  Private
const getFoodNutritionDetails = async (req, res) => {
  const { id } = req.params;
  const apiKey = process.env.USDA_API_KEY;

  const mockItem = MOCK_FOODS.find(f => f.fdcId === id);

  if (!apiKey || apiKey === 'DEMO_KEY' || apiKey === 'your_usda_api_key_here') {
    if (mockItem) {
      return res.status(200).json({ success: true, source: 'mock', data: mockItem });
    }
    return res.status(404).json({ success: false, message: 'Food item not found in mock database' });
  }

  try {
    const response = await fetch(`https://api.nal.usda.gov/fdc/v1/food/${id}?api_key=${apiKey}`);
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || 'USDA get food API failed');
    }

    const getNutrient = (nameOrId) => {
      if (!data.foodNutrients || !Array.isArray(data.foodNutrients)) return 0;
      const nut = data.foodNutrients.find(
        n => n.nutrient?.id === nameOrId || n.nutrient?.name === nameOrId
      );
      return nut && typeof nut.amount !== 'undefined' && nut.amount !== null ? Number(nut.amount) : 0;
    };

    const foodDetails = {
      fdcId: String(data.fdcId),
      description: data.description,
      brandOwner: data.brandOwner || 'Generic / USDA',
      servingSize: data.servingSize || 100,
      servingSizeUnit: data.servingSizeUnit || 'g',
      nutrition: {
        calories: Math.round(getNutrient(1008) || getNutrient('Energy')),
        protein: Number((getNutrient(1003) || getNutrient('Protein')).toFixed(1)),
        fat: Number((getNutrient(1004) || getNutrient('Total lipid (fat)')).toFixed(1)),
        carbs: Number((getNutrient(1005) || getNutrient('Carbohydrate, by difference')).toFixed(1))
      }
    };

    res.status(200).json({
      success: true,
      source: 'usda-api',
      data: foodDetails
    });
  } catch (error) {
    console.error('USDA details fetch failed. Falling back. Error:', error.message);
    if (mockItem) {
      return res.status(200).json({ success: true, source: 'mock-fallback', data: mockItem });
    }
    res.status(500).json({ success: false, message: 'Could not fetch food details from USDA API.' });
  }
};

module.exports = {
  searchFoodNutrition,
  getFoodNutritionDetails
};
