# Troubleshooting Voice Message Error

## Error: "Unexpected token '<', "<!DOCTYPE "... is not valid JSON"

This error means the backend is returning HTML instead of JSON. Here's how to fix it:

### Step 1: Check Backend Server
1. Make sure your backend server is running
2. Open terminal in `backbone-backend` folder
3. Run: `node server.js` or `npm start`
4. You should see: "✅ Server is running on port 5000"

### Step 2: Restart Backend Server
**IMPORTANT**: After changing server.js to increase the limit to 100MB, you MUST restart the server:
1. Stop the server (Ctrl+C)
2. Start it again: `node server.js`

### Step 3: Check Server Logs
When you try to post, check the backend terminal for errors:
- Look for "Error creating post:" messages
- Check for MongoDB connection errors
- Look for "PayloadTooLargeError" messages

### Step 4: Test Without Voice
Try posting without voice messages first:
1. Type only text in title and content
2. Don't record any voice
3. Click "Add Post"
4. If this works, the issue is with voice data size

### Step 5: Reduce Voice Quality (if needed)
If voice messages are too large, you can reduce quality in ForumForm.js:

```javascript
// In startRecording function, change:
const mediaRecorder = new MediaRecorder(stream);

// To:
const mediaRecorder = new MediaRecorder(stream, {
  mimeType: 'audio/webm;codecs=opus',
  audioBitsPerSecond: 32000  // Lower bitrate = smaller file
});
```

### Step 6: Check MongoDB Connection
Make sure MongoDB is running and connected:
1. Check `.env` file has correct `MONGO_URI`
2. Check backend logs for "MongoDB Connected" message

### Step 7: Check Token
Make sure you're logged in:
1. Open browser console (F12)
2. Type: `localStorage.getItem('token')`
3. Should return a long string (JWT token)
4. If null, you need to login again

### Common Solutions:

#### Solution 1: Restart Backend
```bash
cd backbone-backend
# Stop server (Ctrl+C)
node server.js
```

#### Solution 2: Clear Browser Cache
1. Open DevTools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"

#### Solution 3: Check Backend URL
In Forum.js, verify:
```javascript
const BACKEND_URL = 'http://localhost:5000';
```

#### Solution 4: Test Backend Directly
Open browser and go to:
```
http://localhost:5000/api/posts
```
Should show list of posts (JSON), not an error page.

### Still Not Working?

Check backend terminal for specific error messages and share them for more help.
