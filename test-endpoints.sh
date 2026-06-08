#!/bin/bash

# NutriPlan API Endpoint Integration Tester
# Runs curl commands against the running local server to test the REST endpoints.

PORT=5001
BASE_URL="http://localhost:$PORT/api"
TOKEN=""
USER_EMAIL="tester_$(date +%s)@example.com"
USER_PWD="password123"
USER_NAME="tester_$(date +%s)"

echo "==========================================="
echo "   NutriPlan API Endpoint Tester"
echo "==========================================="
echo "Assuming server is running on port $PORT..."
echo "If not, start it in another terminal: npm run dev"
echo "-------------------------------------------"

# 1. TEST REGISTRATION
echo -e "\n[1/5] Testing User Registration..."
REG_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"$USER_NAME\", \"email\": \"$USER_EMAIL\", \"password\": \"$USER_PWD\"}")

echo "Response: $REG_RESPONSE"

if [[ $REG_RESPONSE == *"\"success\":true"* ]]; then
  echo "✅ Registration Succeeded!"
else
  echo "❌ Registration Failed."
fi

# 2. TEST LOGIN
echo -e "\n[2/5] Testing User Login..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$USER_EMAIL\", \"password\": \"$USER_PWD\"}")

echo "Response: $LOGIN_RESPONSE"

if [[ $LOGIN_RESPONSE == *"\"success\":true"* ]]; then
  echo "✅ Login Succeeded!"
  # Extract token (rough grep/sed for token value in JSON)
  TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | grep -o '[^"]*$')
  echo "JWT Token Captured: ${TOKEN:0:20}..."
else
  echo "❌ Login Failed."
  exit 1
fi

# 3. TEST RECIPE SEARCH (PUBLIC)
echo -e "\n[3/5] Testing Recipe Search (Public endpoint)..."
SEARCH_RESPONSE=$(curl -s -X GET "$BASE_URL/recipes/search?query=chicken&maxCalories=600")

if [[ $SEARCH_RESPONSE == *"\"success\":true"* ]]; then
  echo "✅ Recipe Search Succeeded!"
  # Extract first recipe title if any
  TITLE=$(echo "$SEARCH_RESPONSE" | grep -o '"title":"[^"]*' | head -n 1 | grep -o '[^"]*$')
  echo "Sample Recipe Found: $TITLE"
else
  echo "❌ Recipe Search Failed."
fi

# 4. TEST AUTHENTICATED USER PROFILE
echo -e "\n[4/5] Testing Profile Retrieval (Authenticated endpoint)..."
PROFILE_RESPONSE=$(curl -s -X GET "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN")

if [[ $PROFILE_RESPONSE == *"\"success\":true"* ]]; then
  echo "✅ Profile Retrieval Succeeded!"
  echo "Logged user email: $(echo "$PROFILE_RESPONSE" | grep -o '"email":"[^"]*' | grep -o '[^"]*$')"
else
  echo "❌ Profile Retrieval Failed."
fi

# 5. TEST SHOPPING LIST MANIPULATION
echo -e "\n[5/5] Testing Shopping List Items..."
# Add item
ADD_RESPONSE=$(curl -s -X POST "$BASE_URL/shoppinglist" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Fresh Spinach", "quantity": 2, "unit": "bags", "category": "Produce"}')

if [[ $ADD_RESPONSE == *"\"success\":true"* ]]; then
  echo "✅ Shopping List Item Add Succeeded!"
  ITEM_ID=$(echo "$ADD_RESPONSE" | grep -o '"_id":"[^"]*' | grep -o '[^"]*$')
  
  # Fetch list
  GET_RESPONSE=$(curl -s -X GET "$BASE_URL/shoppinglist" \
    -H "Authorization: Bearer $TOKEN")
  
  if [[ $GET_RESPONSE == *"\"name\":\"Fresh Spinach\""* ]]; then
    echo "✅ Shopping List Retrieval verified item presence!"
  else
    echo "❌ Shopping List Item not found in list."
  fi
  
  # Delete item
  DEL_RESPONSE=$(curl -s -X DELETE "$BASE_URL/shoppinglist/$ITEM_ID" \
    -H "Authorization: Bearer $TOKEN")
  
  if [[ $DEL_RESPONSE == *"\"success\":true"* ]]; then
    echo "✅ Shopping List Item Deletion Succeeded!"
  else
    echo "❌ Shopping List Item Deletion Failed."
  fi
else
  echo "❌ Shopping List Add Failed."
fi

echo -e "\n==========================================="
echo "   Endpoint Testing Complete!"
echo "==========================================="
