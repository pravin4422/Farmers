# 🔧 Fix: "Unexpected token '<', "<!DOCTYPE "... is not valid JSON"

## Problem
The error means the backend is returning HTML instead of JSON, indicating the route isn't being found.

## Solution (Choose One)

### Option 1: Restart Backend Server (Recommended)
```bash
# Stop the current server (Ctrl+C in the terminal)
# Then restart:
cd backbone-backend
npm start
```

### Option 2: Use Restart Script
```bash
cd backbone-backend
restart-server.bat
```

### Option 3: Manual Verification

1. **Check if server is running:**
   - Open browser: http://localhost:5000
   - Should see: "Backbone backend is running..."

2. **Test the route directly:**
   - Open browser console (F12)
   - Run this code:
   ```javascript
   fetch('http://localhost:5000/api/crop-recommendation/recommend', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'Authorization': 'Bearer ' + localStorage.getItem('token')
     },
     body: JSON.stringify({ targetYear: 2024, targetSeason: 'All' })
   })
   .then(r => r.json())
   .then(d => console.log(d))
   .catch(e => console.error(e));
   ```

3. **Check console output:**
   - Look for "Crop recommendation request from user:"
   - Look for "Found creator records: X"

## Common Issues & Fixes

### Issue 1: Server not restarted
**Fix:** Stop server (Ctrl+C) and run `npm start` again

### Issue 2: Wrong port
**Fix:** Verify server is on port 5000, not 3000

### Issue 3: Route not registered
**Fix:** Check server.js has this line:
```javascript
app.use('/api/crop-recommendation', cropRecommendationRoutes);
```

### Issue 4: Files not saved
**Fix:** Ensure all files are saved (Ctrl+S)

### Issue 5: Node modules issue
**Fix:** 
```bash
cd backbone-backend
npm install
npm start
```

## Verification Steps

After restarting, verify:

1. ✅ Server starts without errors
2. ✅ Console shows: "✅ Server is running on port 5000"
3. ✅ No error messages about missing modules
4. ✅ Browser can access http://localhost:5000

## Test the Feature

1. Login to your app
2. Go to AI Chat
3. Click "🎯 Best Crop" button
4. Should see recommendations (or error about no data)

## Expected Responses

### Success (with data):
```json
{
  "success": true,
  "topRecommendations": [...],
  "insights": {...}
}
```

### Success (no data):
```json
{
  "success": false,
  "error": "No historical farming data found..."
}
```

### Error (server issue):
```json
{
  "success": false,
  "error": "Failed to generate recommendations",
  "details": "..."
}
```

## Still Not Working?

1. **Check backend logs** - Look for error messages
2. **Check browser console** - Look for network errors
3. **Verify token** - Make sure you're logged in
4. **Check MongoDB** - Ensure database is running
5. **Port conflict** - Make sure port 5000 is free

## Quick Debug Commands

```bash
# Check if port 5000 is in use
netstat -ano | findstr :5000

# Kill process on port 5000 (if needed)
# Find PID from above command, then:
taskkill /F /PID <PID>

# Restart server
cd backbone-backend
npm start
```

## Contact Support

If still having issues, provide:
- Backend console output
- Browser console errors
- Network tab screenshot (F12 → Network)
- Server.js content around line 65

---

**Most Common Fix:** Just restart the backend server! 🔄
