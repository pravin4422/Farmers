# Restart Backend Server

The AI validation endpoint has been added. To use it, you need to restart your backend server.

## Steps:

1. **Stop the current backend server** (if running):
   - Press `Ctrl + C` in the terminal where the backend is running

2. **Start the backend server again**:
   ```bash
   cd backbone-backend
   node server.js
   ```
   OR if you're using nodemon:
   ```bash
   cd backbone-backend
   nodemon server.js
   ```

3. **Verify the server is running**:
   - You should see: `✅ Server is running on port 5000`
   - The new endpoint `/api/posts/:id/validate` is now available

## What was added:

- **Frontend**: AI Check button on each post
- **Backend**: New endpoint `POST /api/posts/:id/validate` that validates individual posts and their comments
- Each post can be validated separately by clicking its own AI Check button
