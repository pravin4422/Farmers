# Shared Data Feature Implementation

## Overview
Implemented a system where all users can add, update, and view Market Prices and Government Schemes data. Every user can see data added by other users in real-time.

## Backend Changes

### 1. New Scheme Model (`models/Scheme.js`)
- Created MongoDB schema for storing government schemes
- Fields: name, category, startDate, endDate, image, details (objective, benefit, eligibility, etc.)
- Tracks userId to identify who added the scheme

### 2. New Scheme Controller (`controllers/schemeController.js`)
- `getAllSchemes()` - Fetch all schemes from all users
- `addScheme()` - Add new scheme (authenticated)
- `updateScheme()` - Update existing scheme (authenticated)

### 3. New Scheme Routes (`routes/schemeRoutes.js`)
- `GET /api/schemes/all` - Public endpoint to get all schemes
- `POST /api/schemes/add` - Authenticated endpoint to add scheme
- `PUT /api/schemes/:id` - Authenticated endpoint to update scheme

### 4. Updated Price Routes (`routes/priceRoutes.js`)
- Added `GET /api/prices/all` - Public endpoint to get all prices from all users
- Existing routes remain for user-specific operations

### 5. Updated Server Configuration (`server.js`)
- Registered scheme routes: `app.use('/api/schemes', schemeRoutes)`

## Frontend Changes

### 1. Updated Prices Page (`pages/Prices.js`)
- Added `allUserPrices` state to store prices from all users
- Added `fetchAllUserPrices()` function to fetch shared data
- Added new table section "All Users' Market Prices" to display community data
- Updated refresh functionality to include all users' data
- Users can still manage their own prices separately

### 2. Updated Schemes Page (`pages/Schemes/Scheme.js`)
- Converted from local state to backend API integration
- Added `useEffect` to fetch schemes on component mount
- Added `fetchSchemes()` function to get all schemes from backend
- Updated `handleAddScheme()` to save to backend instead of local state
- All users can now see schemes added by any user
- Made End Date optional for ongoing schemes

## Features

### Market Prices
✅ Any user can add new market prices
✅ All users can view prices added by others
✅ Users can only delete their own prices
✅ Three sections:
   - Today's Market Prices (from all sources)
   - My Manually Entered Prices (user's own data)
   - All Users' Market Prices (community data)
   - Government Market Prices (external API)

### Government Schemes
✅ Any user can add new government schemes
✅ All users can view schemes added by others
✅ Schemes include: name, category, dates, benefits, eligibility, etc.
✅ Filter by category and status (ongoing/old)
✅ Search functionality across all schemes
✅ Expandable cards with detailed information

## How It Works

1. **Adding Data**: When a user adds a price or scheme, it's saved to MongoDB with their userId
2. **Viewing Data**: All users fetch data from public endpoints that return all records
3. **Permissions**: Users can only delete their own prices, but everyone can view all data
4. **Real-time Updates**: Data refreshes when users add/delete items

## API Endpoints

### Schemes
- `GET /api/schemes/all` - Get all schemes (public)
- `POST /api/schemes/add` - Add scheme (requires auth)
- `PUT /api/schemes/:id` - Update scheme (requires auth)

### Prices
- `GET /api/prices/all` - Get all prices (public)
- `GET /api/prices/my-prices` - Get user's prices (requires auth)
- `POST /api/prices/add` - Add price (requires auth)
- `DELETE /api/prices/:id` - Delete price (requires auth)

## Security
- Authentication required for adding/updating/deleting data
- Public read access for viewing all data
- Users can only delete their own price entries
- All data is stored with userId for tracking

## Next Steps (Optional Enhancements)
- Add edit functionality for schemes
- Add user attribution (show who added each entry)
- Add voting/rating system for schemes
- Add comments/discussion feature
- Add data validation and moderation
- Add pagination for large datasets
