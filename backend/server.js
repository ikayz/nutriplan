const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

// Route files
const authRoutes = require('./routes/authRoutes');
const recipeRoutes = require('./routes/recipeRoutes');
const nutritionRoutes = require('./routes/nutritionRoutes');
const mealPlanRoutes = require('./routes/mealPlanRoutes');
const shoppingListRoutes = require('./routes/shoppingListRoutes');

// Initialize app
const app = express();

// Connect to database
connectDB();

// Body parser middleware
app.use(express.json());

// Enable CORS
app.use(cors());

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/mealplans', mealPlanRoutes);
app.use('/api/shoppinglist', shoppingListRoutes);

// Serve static assets in production/development
app.use(express.static(path.join(__dirname, '../frontend')));

// Fallback: Send index.html for any unknown route (supports SPA routes if any, or general access)
// Fallback: serve frontend index.html for any non-API GET request (SPA support)
app.use((req, res, next) => {
  // Only handle GET requests that are not API calls
  if (req.method !== 'GET' || req.path.startsWith('/api')) {
    return next();
  }

  res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Server Error',
  });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(
    `Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`,
  );
  console.log(
    `Open http://localhost:${PORT} in your browser to view the application.`,
  );
});
// Reload Trigger 2
