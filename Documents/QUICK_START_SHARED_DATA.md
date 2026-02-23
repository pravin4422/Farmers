# Quick Start Guide - Shared Data Feature

## Starting the Application

### 1. Start Backend Server
```bash
cd backbone-backend
npm start
```
Server should run on: http://localhost:5000

### 2. Start Frontend
```bash
cd frontend
npm start
```
Frontend should run on: http://localhost:3000

## Testing Market Prices

1. **Login** to your account
2. Navigate to **Market Prices** page
3. **Add a new price entry**:
   - Fill in commodity, market, state
   - Enter min/max prices
   - Select arrival date
   - Click "Add Price Entry"
4. **View your data** in "My Manually Entered Prices" section
5. **View all users' data** in "All Users' Market Prices" section
6. **Login with another account** to verify both users can see each other's data

## Testing Government Schemes

1. **Login** to your account
2. Navigate to **Government Schemes** page
3. **Add a new scheme**:
   - Click "Add New Scheme" button
   - Fill in required fields:
     - Scheme Name (required)
     - Start Date (required)
     - End Date (optional - leave blank for ongoing)
   - Fill in optional details:
     - Category
     - Objective
     - Benefit
     - Eligibility
     - Website
   - Click "Add Scheme"
4. **View the scheme** in the schemes grid
5. **Login with another account** to verify both users can see the scheme

## Key Features to Test

### Market Prices
- ✅ Add new price entries
- ✅ View your own prices
- ✅ View all users' prices
- ✅ Delete only your own prices
- ✅ Search and filter functionality
- ✅ Today's prices highlighting
- ✅ Export to CSV
- ✅ Print report

### Government Schemes
- ✅ Add new schemes
- ✅ View all schemes from all users
- ✅ Search schemes by name/category
- ✅ Filter by category
- ✅ Filter by status (ongoing/old)
- ✅ Expand/collapse scheme details
- ✅ Click to search on Google
- ✅ Visit scheme website

## Expected Behavior

1. **Data Sharing**: When User A adds data, User B should see it immediately after refresh
2. **Permissions**: Users can only delete their own price entries
3. **Real-time**: Data updates when users add/delete items
4. **Persistence**: All data is saved to MongoDB and persists across sessions

## Troubleshooting

### Backend not starting?
- Check if MongoDB is running
- Verify .env file has correct database connection string
- Check port 5000 is not in use

### Frontend not connecting?
- Verify backend is running on port 5000
- Check browser console for errors
- Verify API endpoints in code match backend routes

### Data not showing?
- Check if user is logged in (token in localStorage)
- Verify backend routes are registered in server.js
- Check MongoDB for data using MongoDB Compass or CLI

## Database Collections

After testing, you should see data in:
- `prices` collection - Market price entries
- `schemes` collection - Government scheme entries
- `users` collection - User accounts

## Notes

- All users can view all data (public read access)
- Authentication required for adding/updating/deleting
- Data is associated with userId for tracking
- No user attribution shown in UI (can be added later)
