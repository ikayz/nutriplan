// NutriPlan Application Client Controller

const App = {
  currentDateRef: new Date(), // Used for meal plan week navigation
  savedRecipesList: [], // Holds array of saved recipe IDs for favorite indicators

  init() {
    this.loadCommonData();
    
    const page = window.location.pathname.split('/').pop() || 'index.html';
    
    if (page === 'recipes.html') {
      this.initRecipesPage();
    } else if (page === 'mealplan.html') {
      this.initMealPlanPage();
    } else if (page === 'shoppinglist.html') {
      this.initShoppingListPage();
    } else if (page === 'profile.html') {
      this.initProfilePage();
    }
  },

  async loadCommonData() {
    if (window.Auth.isLoggedIn()) {
      try {
        const res = await window.API.recipes.getSaved();
        if (res.success) {
          this.savedRecipesList = res.data.map(r => r.spoonacularId || r._id);
        }
      } catch (err) {
        console.error('Could not preload saved recipes:', err.message);
      }
    }
  },

  /* -------------------------------------------------------------
     1. RECIPE SEARCH PAGE (recipes.html)
     ------------------------------------------------------------- */
  initRecipesPage() {
    const searchForm = document.getElementById('search-form');
    const recipesGrid = document.getElementById('recipes-grid');
    const detailsModal = document.getElementById('recipe-details-modal');
    const btnCloseDetails = document.getElementById('btn-close-details');

    if (searchForm) {
      searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const query = document.getElementById('query-input').value;
        const diet = document.getElementById('diet-select').value;
        const maxCalories = document.getElementById('calories-select').value;

        recipesGrid.innerHTML = `
          <div class="skeleton-card"></div>
          <div class="skeleton-card"></div>
          <div class="skeleton-card"></div>
        `;

        try {
          const res = await window.API.recipes.search(query, diet, maxCalories);
          if (res.success) {
            this.renderRecipeCards(res.results, recipesGrid);
          }
        } catch (err) {
          recipesGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--accent-rose);">Error searching recipes. Please try again.</p>`;
        }
      });

      // Trigger default search on load
      searchForm.querySelector('button[type="submit"]').click();
    }

    if (btnCloseDetails) {
      btnCloseDetails.addEventListener('click', () => {
        detailsModal.classList.remove('active');
      });
      detailsModal.addEventListener('click', (e) => {
        if (e.target === detailsModal) detailsModal.classList.remove('active');
      });
    }
  },

  renderRecipeCards(recipes, container) {
    if (!recipes || recipes.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 4rem 0; color: var(--text-muted);">
          <p style="font-size: 2rem;">🍽️</p>
          <p>No recipes found matching your filters.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = recipes.map(recipe => {
      const isSaved = this.savedRecipesList.includes(recipe.id);
      return `
        <article class="recipe-card glass-panel" data-id="${recipe.id}">
          <div class="recipe-image-wrapper">
            <img class="recipe-image" src="${recipe.image || 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&auto=format&fit=crop&q=80'}" alt="${recipe.title}" loading="lazy">
            <button class="recipe-btn-save ${isSaved ? 'saved' : ''}" onclick="event.stopPropagation(); window.App.toggleSaveRecipe(${recipe.id}, this)">
              ❤️
            </button>
          </div>
          
          <div class="recipe-content" style="cursor: pointer;" onclick="window.App.openRecipeDetails(${recipe.id})">
            <h4 class="recipe-title">${recipe.title}</h4>
            
            <div class="recipe-meta">
              <span>⏱️ ${recipe.readyInMinutes || 15} mins</span>
              <span>👥 ${recipe.servings || 1} serv</span>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: 0.8rem; border-top: 1px solid var(--border-glass);">
              <span class="recipe-nutrition-tag">🔥 ${recipe.nutrition?.calories || 0} kcal</span>
              <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700;">PRO: ${recipe.nutrition?.protein || '0g'}</span>
            </div>
          </div>
        </article>
      `;
    }).join('');
  },

  async toggleSaveRecipe(spoonacularId, buttonEl) {
    if (!window.Auth.isLoggedIn()) {
      window.API.showToast('Please log in to save recipes.', true);
      window.Auth.openModal('login-modal');
      return;
    }

    const isCurrentlySaved = buttonEl.classList.contains('saved');

    try {
      if (isCurrentlySaved) {
        // Find cached recipe database ID by matching spoonacularId
        const savedRes = await window.API.recipes.getSaved();
        const fullRecipeObj = savedRes.data.find(r => r.spoonacularId === spoonacularId);
        if (fullRecipeObj) {
          await window.API.recipes.unsave(fullRecipeObj._id);
          buttonEl.classList.remove('saved');
          this.savedRecipesList = this.savedRecipesList.filter(id => id !== spoonacularId);
          window.API.showToast('Removed from favorites.');
        }
      } else {
        // Fetch detailed recipe info first to cache
        const res = await window.API.recipes.getDetails(spoonacularId);
        if (res.success) {
          await window.API.recipes.save(res.recipe);
          buttonEl.classList.add('saved');
          this.savedRecipesList.push(spoonacularId);
          window.API.showToast('Saved to favorites!');
        }
      }
    } catch (err) {
      console.error(err);
    }
  },

  async openRecipeDetails(spoonacularId) {
    const detailsModal = document.getElementById('recipe-details-modal');
    const modalBody = document.getElementById('modal-recipe-body');
    if (!detailsModal || !modalBody) return;

    modalBody.innerHTML = `
      <div style="text-align: center; padding: 3rem 0;">
        <p>Loading recipe details...</p>
      </div>
    `;
    detailsModal.classList.add('active');

    try {
      const res = await window.API.recipes.getDetails(spoonacularId);
      if (res.success) {
        const r = res.recipe;
        
        // Build ingredients bullet list
        const ingredientsHtml = r.extendedIngredients.map(i => `<li>${i.originalString || `${i.amount} ${i.unit} ${i.name}`}</li>`).join('');
        
        // Build instructions list
        const instructionsHtml = r.analyzedInstructions.length > 0
          ? r.analyzedInstructions.map(s => `<li>${s.instruction}</li>`).join('')
          : '<li>No structured instructions available. Refer to source URL.</li>';

        // Check if logged in to show add-to-meal-plan scheduler option
        let mealPlanFormHtml = '';
        if (window.Auth.isLoggedIn()) {
          // Generate date options for the next 7 days
          const dateOptions = [];
          for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            const dateLabel = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            dateOptions.push(`<option value="${dateStr}">${dateLabel}</option>`);
          }

          mealPlanFormHtml = `
            <div class="add-meal-plan-form">
              <h4 class="modal-section-title" style="color: var(--accent-emerald);">📅 Schedule in Meal Planner</h4>
              <form id="modal-add-meal-form" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)) auto; gap: 1rem; align-items: flex-end; margin-top: 1rem;">
                <div class="form-group" style="margin-bottom: 0;">
                  <label class="form-label" for="sched-date">Select Day</label>
                  <select id="sched-date" class="filter-select" style="width: 100%;" required>
                    ${dateOptions.join('')}
                  </select>
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                  <label class="form-label" for="sched-slot">Select Meal Slot</label>
                  <select id="sched-slot" class="filter-select" style="width: 100%;" required>
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                    <option value="snack">Snack</option>
                  </select>
                </div>
                <button type="submit" class="btn btn-primary" style="justify-content: center; height: 44px;">
                  Add Meal
                </button>
              </form>
            </div>
          `;
        }

        modalBody.innerHTML = `
          <div class="modal-recipe-hero">
            <img class="modal-recipe-img" src="${r.image || 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&auto=format&fit=crop&q=80'}" alt="${r.title}">
            <div class="modal-recipe-stats">
              <h3 style="font-family: var(--font-heading); font-size: 1.6rem; font-weight: 800; line-height: 1.2; margin-bottom: 0.8rem;">${r.title}</h3>
              <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem;">
                <span class="diet-badge">🔥 ${r.nutrition?.calories || 0} kcal</span>
                <span class="diet-badge" style="background: rgba(16, 185, 129, 0.1); color: var(--accent-emerald);">⏱️ ${r.readyInMinutes} mins</span>
                <span class="diet-badge" style="background: rgba(245, 158, 11, 0.1); color: #f59e0b;">👥 Serves ${r.servings}</span>
              </div>
              <div class="recipe-macros" style="border-top: none; padding-top: 0; text-align: left;">
                <div class="macro-item"><span class="macro-val">${r.nutrition?.protein || '0g'}</span><span>Protein</span></div>
                <div class="macro-item"><span class="macro-val">${r.nutrition?.carbs || '0g'}</span><span>Carbs</span></div>
                <div class="macro-item"><span class="macro-val">${r.nutrition?.fat || '0g'}</span><span>Fat</span></div>
              </div>
            </div>
          </div>

          <div style="margin-bottom: 1.5rem; font-size: 0.95rem; color: var(--text-secondary); line-height: 1.5;">
            ${r.summary || ''}
          </div>

          <div class="modal-recipe-content" style="display: grid; grid-template-columns: 1fr; gap: 2rem;">
            <div>
              <h4 class="modal-section-title">🌿 Ingredients</h4>
              <ul class="modal-ingredients-list">
                ${ingredientsHtml}
              </ul>
            </div>
            <div>
              <h4 class="modal-section-title">🍳 Cooking Instructions</h4>
              <ol class="modal-instructions-list">
                ${instructionsHtml}
              </ol>
            </div>
          </div>
          
          ${mealPlanFormHtml}
        `;

        // Add event listener to form if present
        const addForm = document.getElementById('modal-add-meal-form');
        if (addForm) {
          addForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const dateStr = document.getElementById('sched-date').value;
            const slot = document.getElementById('sched-slot').value;

            try {
              // 1. Fetch current meal plan for date
              const getPlanRes = await window.API.mealPlans.getByDate(dateStr);
              const plan = getPlanRes.data;

              // Ensure arrays exist
              if (!plan.meals) plan.meals = { breakfast: [], lunch: [], dinner: [], snack: [] };
              if (!plan.meals[slot]) plan.meals[slot] = [];

              // Add current recipe reference
              plan.meals[slot].push({
                recipe: r._id, // Must be database ID
                calories: r.nutrition?.calories || 0
              });

              // 2. Save/Update meal plan
              await window.API.mealPlans.update(dateStr, plan.meals);
              window.API.showToast(`Recipe added to ${slot.toUpperCase()} for ${dateStr}!`);
              detailsModal.classList.remove('active');
            } catch (err) {
              console.error(err);
            }
          });
        }
      }
    } catch (err) {
      modalBody.innerHTML = `<p style="color: var(--accent-rose); text-align: center;">Error loading recipe details.</p>`;
    }
  },

  /* -------------------------------------------------------------
     2. MEAL PLANNER GRID PAGE (mealplan.html)
     ------------------------------------------------------------- */
  initMealPlanPage() {
    this.setupMealDates();
    this.loadWeeklyMeals();

    document.getElementById('btn-prev-week').addEventListener('click', () => {
      this.currentDateRef.setDate(this.currentDateRef.getDate() - 7);
      this.setupMealDates();
      this.loadWeeklyMeals();
    });

    document.getElementById('btn-next-week').addEventListener('click', () => {
      this.currentDateRef.setDate(this.currentDateRef.getDate() + 7);
      this.setupMealDates();
      this.loadWeeklyMeals();
    });

    document.getElementById('btn-clear-week').addEventListener('click', async () => {
      if (confirm('Are you sure you want to clear this entire week\'s meal schedule?')) {
        const datesOfWeek = this.getDatesOfWeek(this.currentDateRef);
        try {
          for (let dateStr of datesOfWeek) {
            await window.API.mealPlans.delete(dateStr);
          }
          window.API.showToast('Week cleared successfully!');
          this.loadWeeklyMeals();
        } catch (err) {
          console.error(err);
        }
      }
    });

    // Close Custom Meal Modal
    const customModal = document.getElementById('add-custom-meal-modal');
    document.getElementById('btn-close-custom-modal').addEventListener('click', () => {
      customModal.classList.remove('active');
    });

    // Handle Custom Meal Form Submission
    document.getElementById('custom-meal-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const dateStr = document.getElementById('custom-meal-date').value;
      const slot = document.getElementById('custom-meal-slot').value;
      const name = document.getElementById('custom-meal-name').value;
      const cals = Number(document.getElementById('custom-meal-calories').value);

      try {
        const getPlanRes = await window.API.mealPlans.getByDate(dateStr);
        const plan = getPlanRes.data;

        if (!plan.meals) plan.meals = { breakfast: [], lunch: [], dinner: [], snack: [] };
        if (!plan.meals[slot]) plan.meals[slot] = [];

        plan.meals[slot].push({
          customMealName: name,
          calories: cals
        });

        await window.API.mealPlans.update(dateStr, plan.meals);
        window.API.showToast(`Custom item added to ${slot.toUpperCase()}!`);
        customModal.classList.remove('active');
        
        // Reset form
        document.getElementById('custom-meal-form').reset();
        
        this.loadWeeklyMeals();
      } catch (err) {
        console.error(err);
      }
    });
  },

  // Get date strings for Monday–Sunday of the week containing the ref date
  getDatesOfWeek(refDate) {
    const currentDay = refDate.getDay();
    // Calculate difference to Monday (if Sunday (0), shift to -6)
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    
    const monday = new Date(refDate);
    monday.setDate(refDate.getDate() + distanceToMonday);

    const dates = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      dates.push(day.toISOString().split('T')[0]);
    }
    return dates;
  },

  setupMealDates() {
    const dates = this.getDatesOfWeek(this.currentDateRef);
    
    // Format week title label (e.g. "Week of Jun 8, 2026")
    const startOfWeek = new Date(dates[0] + 'T00:00:00');
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    document.getElementById('current-week-label').textContent = `Week of ${startOfWeek.toLocaleDateString('en-US', options)}`;

    // Set calorie limit display based on user profile preferences
    const user = window.Auth.getUser();
    if (user && user.preferences) {
      document.getElementById('calorie-target-display').textContent = `${user.preferences.calorieGoal || 2000} kcal`;
    }
  },

  async loadWeeklyMeals() {
    const container = document.getElementById('mealplan-weekly-grid');
    if (!container) return;

    container.innerHTML = `
      <div class="skeleton-card" style="height: 200px;"></div>
      <div class="skeleton-card" style="height: 200px;"></div>
    `;

    const dates = this.getDatesOfWeek(this.currentDateRef);
    const daysOfWeekNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const user = window.Auth.getUser();
    const calorieGoal = user?.preferences?.calorieGoal || 2000;

    try {
      // Fetch user's meal plans
      const res = await window.API.mealPlans.getAll();
      const plans = res.data || [];

      // Map plans to date key for easy lookups
      const planByDateMap = {};
      plans.forEach(p => {
        planByDateMap[p.date] = p;
      });

      let weeklyHtml = '';

      for (let i = 0; i < 7; i++) {
        const dateStr = dates[i];
        const dayLabel = daysOfWeekNames[i];
        const formattedDate = new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        const plan = planByDateMap[dateStr] || { meals: { breakfast: [], lunch: [], dinner: [], snack: [] } };
        const meals = plan.meals;

        // Calculate total daily calories
        let totalCals = 0;
        const slots = ['breakfast', 'lunch', 'dinner', 'snack'];
        slots.forEach(s => {
          if (meals[s]) {
            meals[s].forEach(item => {
              totalCals += item.calories || 0;
            });
          }
        });

        // Stylize warning badge if daily calories exceed goal
        const isOverLimit = totalCals > calorieGoal;
        const calLabelClass = isOverLimit ? 'background: rgba(244, 63, 94, 0.15); color: var(--accent-rose); border: 1px solid var(--accent-rose);' : 'background: rgba(6, 182, 212, 0.1);';

        // Function to build lists for each slot
        const buildSlotHtml = (slotName) => {
          const items = meals[slotName] || [];
          let itemsHtml = '';

          if (items.length === 0) {
            itemsHtml = `<span style="font-size:0.75rem; color:var(--text-muted);">Empty</span>`;
          } else {
            itemsHtml = items.map((item, idx) => {
              const name = item.recipe ? item.recipe.title : item.customMealName;
              const itemId = item._id;
              return `
                <div class="meal-item">
                  <div class="meal-item-details">
                    <span class="meal-item-name" title="${name}">${name}</span>
                    <span class="meal-item-cals">🔥 ${item.calories} kcal</span>
                  </div>
                  <button class="btn-remove-meal-item" onclick="window.App.deleteMealPlanItem('${dateStr}', '${slotName}', '${itemId}')">&times;</button>
                </div>
              `;
            }).join('');
          }

          return `
            <div class="meal-slot glass-panel">
              <span class="meal-slot-label">${slotName}</span>
              <div class="meal-items-container">
                ${itemsHtml}
              </div>
              <button class="btn-add-meal" onclick="window.App.openCustomMealModal('${dateStr}', '${slotName}')">➕ Add Item</button>
            </div>
          `;
        };

        weeklyHtml += `
          <div class="day-plan-card glass-panel">
            <div class="day-header">
              <div class="day-title-info">
                <span class="day-name">${dayLabel}</span>
                <span class="day-date">${formattedDate}</span>
              </div>
              <div class="day-calories-summary diet-badge" style="${calLabelClass}">
                Daily Calories: <span>${totalCals}</span> / ${calorieGoal} kcal
              </div>
            </div>
            
            <div class="meals-layout">
              ${buildSlotHtml('breakfast')}
              ${buildSlotHtml('lunch')}
              ${buildSlotHtml('dinner')}
              ${buildSlotHtml('snack')}
            </div>
          </div>
        `;
      }

      container.innerHTML = weeklyHtml;

    } catch (err) {
      container.innerHTML = `<p style="color:var(--accent-rose); text-align:center;">Could not load meal plans. Please reload page.</p>`;
    }
  },

  openCustomMealModal(dateStr, slotName) {
    const modal = document.getElementById('add-custom-meal-modal');
    if (modal) {
      document.getElementById('custom-meal-date').value = dateStr;
      document.getElementById('custom-meal-slot').value = slotName;
      modal.classList.add('active');
    }
  },

  async deleteMealPlanItem(dateStr, slotName, itemId) {
    try {
      const getPlanRes = await window.API.mealPlans.getByDate(dateStr);
      const plan = getPlanRes.data;

      if (plan.meals && plan.meals[slotName]) {
        // Filter out item by database object ID
        plan.meals[slotName] = plan.meals[slotName].filter(item => item._id.toString() !== itemId);

        await window.API.mealPlans.update(dateStr, plan.meals);
        window.API.showToast('Meal removed.');
        this.loadWeeklyMeals();
      }
    } catch (err) {
      console.error(err);
    }
  },

  /* -------------------------------------------------------------
     3. SHOPPING LIST PAGE (shoppinglist.html)
     ------------------------------------------------------------- */
  initShoppingListPage() {
    this.loadShoppingList();

    // Bind manually add form
    const addForm = document.getElementById('shopping-add-form');
    if (addForm) {
      addForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('item-name').value;
        const quantity = Number(document.getElementById('item-qty').value);
        const unit = document.getElementById('item-unit').value;
        const category = document.getElementById('item-category').value;

        try {
          await window.API.shoppingList.add({ name, quantity, unit, category });
          window.API.showToast('Item added to grocery list!');
          addForm.reset();
          document.getElementById('item-qty').value = 1;
          this.loadShoppingList();
        } catch (err) {
          console.error(err);
        }
      });
    }

    // Clear completed items button
    document.getElementById('btn-clear-completed').addEventListener('click', async () => {
      try {
        await window.API.shoppingList.clearCompleted();
        window.API.showToast('Checked items cleared.');
        this.loadShoppingList();
      } catch (err) {
        console.error(err);
      }
    });

    // Auto-generate items button
    document.getElementById('btn-generate-list').addEventListener('click', async () => {
      const btn = document.getElementById('btn-generate-list');
      btn.disabled = true;
      btn.textContent = 'Generating...';
      try {
        const res = await window.API.shoppingList.generate();
        window.API.showToast(res.message);
        this.loadShoppingList();
      } catch (err) {
        console.error(err);
      } finally {
        btn.disabled = false;
        btn.textContent = '🛒 Auto-Generate from Plan';
      }
    });
  },

  async loadShoppingList() {
    const container = document.getElementById('shopping-categories-container');
    if (!container) return;

    try {
      const res = await window.API.shoppingList.get();
      const list = res.data || [];

      if (list.length === 0) {
        container.innerHTML = `
          <div style="text-align: center; padding: 3rem 0; color: var(--text-muted);">
            <p style="font-size: 2.5rem; margin-bottom: 0.5rem;">🧺</p>
            <p>Your shopping list is empty.</p>
            <p style="font-size: 0.85rem; margin-top: 0.4rem;">Add items manually using the panel on the right or click "Auto-Generate from Plan".</p>
          </div>
        `;
        return;
      }

      // Group items by category
      const categoriesMap = {};
      list.forEach(item => {
        if (!categoriesMap[item.category]) {
          categoriesMap[item.category] = [];
        }
        categoriesMap[item.category].push(item);
      });

      let listHtml = '';
      const catList = Object.keys(categoriesMap).sort();

      catList.forEach(cat => {
        const items = categoriesMap[cat];
        
        const itemsRowsHtml = items.map(item => {
          return `
            <div class="shopping-item-row ${item.completed ? 'completed' : ''}" data-id="${item._id}">
              <div class="shopping-item-left">
                <input type="checkbox" class="shopping-checkbox-custom" ${item.completed ? 'checked' : ''} onchange="window.App.toggleShoppingItem('${item._id}', this.checked)">
                <span class="shopping-item-text">${item.name}</span>
              </div>
              <div style="display: flex; align-items: center; gap: 1rem;">
                <span class="shopping-item-qty">${item.quantity} ${item.unit || ''}</span>
                <button class="btn-shopping-delete" onclick="window.App.deleteShoppingItem('${item._id}')">🗑️</button>
              </div>
            </div>
          `;
        }).join('');

        listHtml += `
          <div class="shopping-category-group">
            <h4 class="shopping-category-title">📦 ${cat}</h4>
            <div class="shopping-items-list">
              ${itemsRowsHtml}
            </div>
          </div>
        `;
      });

      container.innerHTML = listHtml;

    } catch (err) {
      container.innerHTML = `<p style="color:var(--accent-rose); text-align:center;">Could not load shopping list items.</p>`;
    }
  },

  async toggleShoppingItem(id, completed) {
    try {
      await window.API.shoppingList.update(id, { completed });
      // Rerender list to adjust strikethroughs
      this.loadShoppingList();
    } catch (err) {
      console.error(err);
    }
  },

  async deleteShoppingItem(id) {
    try {
      await window.API.shoppingList.delete(id);
      window.API.showToast('Item deleted.');
      this.loadShoppingList();
    } catch (err) {
      console.error(err);
    }
  },

  /* -------------------------------------------------------------
     4. USER PROFILE PAGE (profile.html)
     ------------------------------------------------------------- */
  initProfilePage() {
    this.setupProfileTabs();
    this.loadProfileData();

    // Goal form submission
    document.getElementById('preferences-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const diet = document.getElementById('pref-diet').value;
      const calorieGoal = Number(document.getElementById('pref-calories').value);
      const proteinGoal = Number(document.getElementById('pref-protein').value);
      const carbsGoal = Number(document.getElementById('pref-carbs').value);
      const fatGoal = Number(document.getElementById('pref-fat').value);

      try {
        const res = await window.API.auth.updatePreferences({
          diet,
          calorieGoal,
          proteinGoal,
          carbsGoal,
          fatGoal
        });
        if (res.success) {
          window.API.showToast('Goal preferences updated successfully!');
          // Update local storage user details
          const currentUser = window.Auth.getUser();
          currentUser.preferences = res.data.preferences;
          localStorage.setItem(window.Auth.userKey, JSON.stringify(currentUser));
          
          this.loadProfileData();
        }
      } catch (err) {
        console.error(err);
      }
    });

    // Custom recipe creator toggler
    const recipeForm = document.getElementById('custom-recipe-form');
    document.getElementById('btn-show-recipe-creator').addEventListener('click', () => {
      recipeForm.style.display = 'block';
    });
    document.getElementById('btn-cancel-recipe-creator').addEventListener('click', () => {
      recipeForm.style.display = 'none';
      recipeForm.reset();
    });

    // Custom recipe form save
    recipeForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('custom-recipe-title').value;
      const time = Number(document.getElementById('custom-recipe-time').value);
      const servings = Number(document.getElementById('custom-recipe-servings').value);
      const ingRaw = document.getElementById('custom-recipe-ingredients').value;
      const instRaw = document.getElementById('custom-recipe-instructions').value;
      const cals = Number(document.getElementById('custom-recipe-calories').value);
      const prot = Number(document.getElementById('custom-recipe-protein').value);

      // Parse ingredients into array
      const ingredients = ingRaw.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => ({ name: line, originalString: line }));

      // Parse instructions into step list
      const instructions = instRaw.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map((line, index) => ({ step: index + 1, instruction: line }));

      try {
        await window.API.recipes.createCustom({
          title,
          readyInMinutes: time,
          servings,
          extendedIngredients: ingredients,
          analyzedInstructions: instructions,
          nutrition: {
            calories: cals,
            protein: `${prot}g`,
            carbs: '0g', // default fallback placeholder
            fat: '0g'
          }
        });
        window.API.showToast('Custom recipe created successfully!');
        recipeForm.style.display = 'none';
        recipeForm.reset();
        this.loadProfileData(); // Reload profile lists
      } catch (err) {
        console.error(err);
      }
    });

    // USDA database search form
    const usdaSearchForm = document.getElementById('usda-search-form');
    if (usdaSearchForm) {
      usdaSearchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const query = document.getElementById('usda-query').value;
        const resultsList = document.getElementById('usda-results-list');

        resultsList.innerHTML = `<p style="grid-column: 1/-1; text-align: center;">Querying USDA Food Database...</p>`;

        try {
          const res = await window.API.nutrition.search(query);
          if (res.success) {
            this.renderUSDAResults(res.results, resultsList);
          }
        } catch (err) {
          resultsList.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--accent-rose);">Error searching USDA. Please check connection.</p>`;
        }
      });
    }

    // Close USDA modal
    const usdaModal = document.getElementById('usda-adder-modal');
    document.getElementById('btn-close-usda-modal').addEventListener('click', () => {
      usdaModal.classList.remove('active');
    });

    // Log USDA item form submission
    document.getElementById('usda-adder-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const dateStr = document.getElementById('usda-log-date').value;
      const slot = document.getElementById('usda-log-slot').value;
      const name = document.getElementById('usda-adder-name').value;
      const cals = Number(document.getElementById('usda-adder-calories').value);

      try {
        const getPlanRes = await window.API.mealPlans.getByDate(dateStr);
        const plan = getPlanRes.data;

        if (!plan.meals) plan.meals = { breakfast: [], lunch: [], dinner: [], snack: [] };
        if (!plan.meals[slot]) plan.meals[slot] = [];

        plan.meals[slot].push({
          customMealName: `[USDA] ${name}`,
          calories: cals
        });

        await window.API.mealPlans.update(dateStr, plan.meals);
        window.API.showToast(`Logged ${name} to ${slot.toUpperCase()} on ${dateStr}!`);
        usdaModal.classList.remove('active');
      } catch (err) {
        console.error(err);
      }
    });
  },

  setupProfileTabs() {
    const tabs = document.querySelectorAll('.profile-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const tabTarget = tab.getAttribute('data-tab');
        const contents = document.querySelectorAll('.profile-tab-content');
        contents.forEach(c => {
          if (c.id === `tab-${tabTarget}`) {
            c.classList.add('active');
          } else {
            c.classList.remove('active');
          }
        });
      });
    });
  },

  async loadProfileData() {
    const user = window.Auth.getUser();
    if (!user) return;

    // Set side panel values
    document.getElementById('profile-username').textContent = user.username;
    document.getElementById('profile-email').textContent = user.email;
    document.getElementById('profile-avatar-initials').textContent = user.username.slice(0, 2).toUpperCase();

    // Populate inputs
    if (user.preferences) {
      document.getElementById('pref-diet').value = user.preferences.diet || '';
      document.getElementById('pref-calories').value = user.preferences.calorieGoal || 2000;
      document.getElementById('pref-protein').value = user.preferences.proteinGoal || 100;
      document.getElementById('pref-carbs').value = user.preferences.carbsGoal || 250;
      document.getElementById('pref-fat').value = user.preferences.fatGoal || 70;
    }

    try {
      // Query full profile details containing saved recipes count & meal plans count
      const profileRes = await window.API.auth.getProfile();
      if (profileRes.success) {
        const u = profileRes.data;
        document.getElementById('stat-saved-count').textContent = u.savedRecipes ? u.savedRecipes.length : 0;
        
        // Count total unique meal plan days logged
        const plansRes = await window.API.mealPlans.getAll();
        document.getElementById('stat-days-count').textContent = plansRes.data ? plansRes.data.length : 0;

        // Render saved/custom recipes grid
        const grid = document.getElementById('custom-recipes-list');
        if (grid) {
          const savedRecipes = u.savedRecipes || [];
          if (savedRecipes.length === 0) {
            grid.innerHTML = `<p style="color: var(--text-muted); grid-column: 1/-1; text-align: center;">No recipes saved yet.</p>`;
          } else {
            grid.innerHTML = savedRecipes.map(r => {
              return `
                <article class="recipe-card glass-panel" style="padding: 1.2rem; display: flex; flex-direction: column; gap: 0.5rem;">
                  <h4 style="font-family: var(--font-heading); font-size: 1.1rem; font-weight: 700;">${r.title}</h4>
                  <span style="font-size: 0.8rem; color: var(--text-muted);">🔥 ${r.nutrition?.calories || 0} kcal | ⏱️ ${r.readyInMinutes || 15} mins</span>
                  <div style="display: flex; gap: 0.5rem; margin-top: auto; padding-top: 0.5rem;">
                    <button class="btn btn-outline btn-sm" style="flex:1; justify-content: center;" onclick="window.App.openRecipeDetails('${r.spoonacularId || r._id}')">View Details</button>
                    <button class="btn btn-danger btn-sm btn-icon-only" onclick="window.App.unsaveRecipeFromProfile('${r._id}')">🗑️</button>
                  </div>
                </article>
              `;
            }).join('');
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  },

  async unsaveRecipeFromProfile(recipeId) {
    try {
      await window.API.recipes.unsave(recipeId);
      window.API.showToast('Recipe removed.');
      this.loadProfileData();
    } catch (err) {
      console.error(err);
    }
  },

  renderUSDAResults(foods, container) {
    if (!foods || foods.length === 0) {
      container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary);">No USDA matching items found.</p>`;
      return;
    }

    container.innerHTML = foods.map(food => {
      const nut = food.nutrition;
      return `
        <article class="recipe-card glass-panel" style="padding: 1.2rem; display: flex; flex-direction: column; gap: 0.6rem;">
          <span style="font-size: 0.7rem; font-weight: 700; color: var(--accent-cyan); text-transform: uppercase;">${food.brandOwner}</span>
          <h4 style="font-family: var(--font-heading); font-size: 1rem; font-weight: 700; line-height: 1.3; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${food.description}">${food.description}</h4>
          
          <div class="recipe-macros" style="border-top: none; padding-top: 0; margin-top: 0.2rem; text-align: left;">
            <div class="macro-item"><span class="macro-val">${nut.calories} kcal</span><span>Calories</span></div>
            <div class="macro-item"><span class="macro-val">${nut.protein}g</span><span>Protein</span></div>
            <div class="macro-item"><span class="macro-val">${nut.carbs}g</span><span>Carbs</span></div>
          </div>
          
          <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600; margin-top: auto;">
            Serving: ${food.servingSize} ${food.servingSizeUnit}
          </div>

          <button class="btn btn-primary btn-sm" style="width: 100%; justify-content: center; margin-top: 0.5rem;" onclick="window.App.openUSDALogger('${food.fdcId}', '${food.description.replace(/'/g, "\\'")}', ${nut.calories}, ${nut.protein}, ${nut.carbs})">
            Log into Meal Plan
          </button>
        </article>
      `;
    }).join('');
  },

  openUSDALogger(fdcId, name, calories, protein, carbs) {
    const modal = document.getElementById('usda-adder-modal');
    if (!modal) return;

    document.getElementById('usda-adder-fdcId').value = fdcId;
    document.getElementById('usda-adder-name').value = name;
    document.getElementById('usda-adder-calories').value = calories;
    
    // Set typical date picker default value to today
    document.getElementById('usda-log-date').value = new Date().toISOString().split('T')[0];

    document.getElementById('usda-adder-summary').textContent = 
      `Logged description: ${name} (${calories} kcal | Protein: ${protein}g | Carbs: ${carbs}g)`;

    modal.classList.add('active');
  }
};

// Start application
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

window.App = App;
