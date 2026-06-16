# NutriPlan

Modernized meal planner and recipe search UI with Express/MongoDB backend.

## Setup

1. Copy `.env.example` to `.env`.
2. Fill in your values:
   - `MONGODB_URI` for MongoDB connection
   - `JWT_SECRET` for token signing
   - `SPOONACULAR_API_KEY` for recipe search/details
   - `USDA_API_KEY` for food nutrition search/details
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the server:
   ```bash
   npm run dev
   ```
5. Open `http://localhost:5001` in your browser.

## Notes

- The frontend loads `frontend/css/theme.css` after `frontend/css/style.css` so the new light UI theme and cards override legacy dark styles.
- If the Spoonacular or USDA API key is missing or still a placeholder, backend routes will fall back to mock data for search and recipe details.
- Use MongoDB at `mongodb://127.0.0.1:27017/nutriplan` or update `MONGODB_URI`.
- To speed up local development, you can disable authentication checks by adding `DISABLE_AUTH=true` to your `.env` (see `.env.example`). When disabled, the server will attempt to use or create a development user (`DEV_USER_EMAIL` / `DEV_USER_PASSWORD`).
