// NutriPlan Central API Client

// Determine base API url based on environment
const API_BASE_URL = window.location.origin.includes('localhost') 
  ? 'http://localhost:5001/api' 
  : '/api';

// Toast Notification Helper
function showToast(message, isError = false) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast glass-panel ${isError ? 'toast-error' : ''}`;
  
  const icon = isError ? '❌' : '✅';
  toast.innerHTML = `
    <span>${icon}</span>
    <span class="toast-message">${message}</span>
  `;

  container.appendChild(toast);

  // Auto remove toast
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100px)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Request Helper
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('nutriplan_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers
  };

  const config = {
    ...options,
    headers
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }

    return data;
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error.message);
    showToast(error.message, true);
    throw error;
  }
}

// Export API modules to window scope for simplicity in vanilla JS
window.API = {
  request,
  showToast,
  
  // Auth endpoints
  auth: {
    register: (username, email, password) => 
      request('/auth/register', { method: 'POST', body: JSON.stringify({ username, email, password }) }),
    login: (email, password) => 
      request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    getProfile: () => 
      request('/auth/me'),
    updatePreferences: (prefs) => 
      request('/auth/preferences', { method: 'PUT', body: JSON.stringify(prefs) })
  },
  
  // Recipes endpoints
  recipes: {
    search: (query, diet, maxCalories) => {
      let params = new URLSearchParams();
      if (query) params.append('query', query);
      if (diet) params.append('diet', diet);
      if (maxCalories) params.append('maxCalories', maxCalories);
      return request(`/recipes/search?${params.toString()}`);
    },
    getDetails: (id) => 
      request(`/recipes/${id}`),
    getSaved: () => 
      request('/recipes/saved'),
    save: (recipeData) => 
      request('/recipes/save', { method: 'POST', body: JSON.stringify(recipeData) }),
    unsave: (recipeId) => 
      request(`/recipes/saved/${recipeId}`, { method: 'DELETE' }),
    createCustom: (recipeData) => 
      request('/recipes/custom', { method: 'POST', body: JSON.stringify(recipeData) })
  },
  
  // Nutrition USDA endpoints
  nutrition: {
    search: (query) => 
      request(`/nutrition/search?query=${encodeURIComponent(query)}`),
    getDetails: (fdcId) => 
      request(`/nutrition/${fdcId}`)
  },
  
  // Meal Plan endpoints
  mealPlans: {
    getAll: () => 
      request('/mealplans'),
    getByDate: (dateStr) => 
      request(`/mealplans/${dateStr}`),
    update: (dateStr, meals) => 
      request('/mealplans', { method: 'POST', body: JSON.stringify({ date: dateStr, meals }) }),
    delete: (dateStr) => 
      request(`/mealplans/${dateStr}`, { method: 'DELETE' })
  },
  
  // Shopping List endpoints
  shoppingList: {
    get: () => 
      request('/shoppinglist'),
    add: (item) => 
      request('/shoppinglist', { method: 'POST', body: JSON.stringify(item) }),
    update: (id, updates) => 
      request(`/shoppinglist/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
    delete: (id) => 
      request(`/shoppinglist/${id}`, { method: 'DELETE' }),
    clearCompleted: () => 
      request('/shoppinglist/clear-completed', { method: 'POST' }),
    generate: () => 
      request('/shoppinglist/generate', { method: 'POST' })
  }
};
