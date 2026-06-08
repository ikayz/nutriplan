// NutriPlan Authentication & Modal Coordinator

const Auth = {
  tokenKey: 'nutriplan_token',
  userKey: 'nutriplan_user',

  init() {
    this.updateNavbar();
    this.setupAuthModals();
    this.guardProtectedPages();
  },

  getToken() {
    return localStorage.getItem(this.tokenKey);
  },

  getUser() {
    const userStr = localStorage.getItem(this.userKey);
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  saveAuth(token, user) {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userKey, JSON.stringify(user));
    this.updateNavbar();
  },

  clearAuth() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.updateNavbar();
    window.location.href = 'index.html';
  },

  isLoggedIn() {
    return !!this.getToken();
  },

  // Redirect users away from protected pages if not authenticated
  guardProtectedPages() {
    const protectedPages = ['mealplan.html', 'shoppinglist.html', 'profile.html'];
    const currentPage = window.location.pathname.split('/').pop();

    if (protectedPages.includes(currentPage) && !this.isLoggedIn()) {
      window.API.showToast('Please log in to access this page.', true);
      setTimeout(() => {
        window.location.href = 'index.html?auth=login';
      }, 1000);
    }
  },

  // Dynamic header rendering
  updateNavbar() {
    const headerActions = document.getElementById('header-actions');
    const navMenu = document.getElementById('nav-menu');
    if (!headerActions) return;

    const user = this.getUser();

    if (this.isLoggedIn() && user) {
      // User is logged in: update nav actions with profile dropdown or simple logout
      headerActions.innerHTML = `
        <div style="display: flex; align-items: center; gap: 1rem;">
          <a href="profile.html" class="btn btn-secondary btn-sm" style="display: flex; align-items: center; gap: 0.5rem;">
            👤 <span>${user.username}</span>
          </a>
          <button id="btn-logout" class="btn btn-danger btn-sm">Logout</button>
        </div>
      `;

      // Enable navigation items for logged in users
      if (navMenu) {
        navMenu.innerHTML = `
          <li><a href="index.html" class="nav-link">Home</a></li>
          <li><a href="recipes.html" class="nav-link">Search Recipes</a></li>
          <li><a href="mealplan.html" class="nav-link">Meal Planner</a></li>
          <li><a href="shoppinglist.html" class="nav-link">Shopping List</a></li>
          <li><a href="profile.html" class="nav-link">Profile</a></li>
        `;
      }

      // Add logout event listener
      document.getElementById('btn-logout').addEventListener('click', () => this.clearAuth());
    } else {
      // User is logged out: show login and register buttons
      headerActions.innerHTML = `
        <button id="btn-show-login" class="btn btn-secondary btn-sm">Login</button>
        <button id="btn-show-register" class="btn btn-primary btn-sm">Sign Up</button>
      `;

      // Limit navigation items
      if (navMenu) {
        navMenu.innerHTML = `
          <li><a href="index.html" class="nav-link">Home</a></li>
          <li><a href="recipes.html" class="nav-link">Search Recipes</a></li>
        `;
      }

      // Add modal click listeners
      document.getElementById('btn-show-login').addEventListener('click', () => this.openModal('login-modal'));
      document.getElementById('btn-show-register').addEventListener('click', () => this.openModal('register-modal'));
    }

    // Set active class on active link based on current path
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      if (link.getAttribute('href') === currentPage) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  },

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
    }
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
    }
  },

  setupAuthModals() {
    // Inject auth modals dynamically into body if they are not already present
    this.injectModalsIfNeeded();

    const modals = ['login-modal', 'register-modal'];
    modals.forEach(id => {
      const modal = document.getElementById(id);
      if (!modal) return;

      // Close modal on close button click
      const closeBtn = modal.querySelector('.btn-modal-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.closeModal(id));
      }

      // Close modal on clicking outside container
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeModal(id);
        }
      });
    });

    // Handle Login Form Submission
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
          const res = await window.API.auth.login(email, password);
          if (res.success) {
            window.API.showToast('Login successful!');
            this.saveAuth(res.data.token, {
              username: res.data.username,
              email: res.data.email,
              preferences: res.data.preferences
            });
            this.closeModal('login-modal');
            
            // Redirect to profile or search
            setTimeout(() => {
              window.location.href = 'recipes.html';
            }, 800);
          }
        } catch (err) {
          // Toast handled by API request wrapper
        }
      });
    }

    // Handle Register Form Submission
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
      registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;

        if (password !== confirmPassword) {
          window.API.showToast('Passwords do not match', true);
          return;
        }

        try {
          const res = await window.API.auth.register(username, email, password);
          if (res.success) {
            window.API.showToast('Account created successfully!');
            this.saveAuth(res.data.token, {
              username: res.data.username,
              email: res.data.email,
              preferences: res.data.preferences
            });
            this.closeModal('register-modal');
            
            // Redirect to profile settings to input preferences
            setTimeout(() => {
              window.location.href = 'profile.html';
            }, 800);
          }
        } catch (err) {
          // Toast handled by API request wrapper
        }
      });
    }

    // Trigger auth modal on page load if query param set
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('auth') === 'login') {
      this.openModal('login-modal');
    } else if (urlParams.get('auth') === 'register') {
      this.openModal('register-modal');
    }
  },

  injectModalsIfNeeded() {
    if (!document.getElementById('login-modal')) {
      const loginHtml = `
        <div id="login-modal" class="modal-overlay">
          <div class="modal-container glass-panel">
            <div class="modal-header">
              <h3 class="modal-title">Sign In to NutriPlan</h3>
              <button class="btn-modal-close">&times;</button>
            </div>
            <div class="modal-body">
              <form id="login-form">
                <div class="form-group">
                  <label class="form-label" for="login-email">Email Address</label>
                  <input type="email" id="login-email" class="form-input" placeholder="you@example.com" required>
                </div>
                <div class="form-group">
                  <label class="form-label" for="login-password">Password</label>
                  <input type="password" id="login-password" class="form-input" placeholder="••••••••" required>
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%; justify-content: center; margin-top: 1rem;">
                  Sign In
                </button>
              </form>
            </div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', loginHtml);
    }

    if (!document.getElementById('register-modal')) {
      const registerHtml = `
        <div id="register-modal" class="modal-overlay">
          <div class="modal-container glass-panel">
            <div class="modal-header">
              <h3 class="modal-title">Create Your Account</h3>
              <button class="btn-modal-close">&times;</button>
            </div>
            <div class="modal-body">
              <form id="register-form">
                <div class="form-group">
                  <label class="form-label" for="register-username">Username</label>
                  <input type="text" id="register-username" class="form-input" placeholder="fitcooker" required>
                </div>
                <div class="form-group">
                  <label class="form-label" for="register-email">Email Address</label>
                  <input type="email" id="register-email" class="form-input" placeholder="you@example.com" required>
                </div>
                <div class="form-group">
                  <label class="form-label" for="register-password">Password (min 6 characters)</label>
                  <input type="password" id="register-password" class="form-input" placeholder="••••••••" minlength="6" required>
                </div>
                <div class="form-group">
                  <label class="form-label" for="register-confirm-password">Confirm Password</label>
                  <input type="password" id="register-confirm-password" class="form-input" placeholder="••••••••" required>
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%; justify-content: center; margin-top: 1rem;">
                  Create Account
                </button>
              </form>
            </div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', registerHtml);
    }
  }
};

// Auto-run on load
document.addEventListener('DOMContentLoaded', () => {
  Auth.init();
});

window.Auth = Auth;
