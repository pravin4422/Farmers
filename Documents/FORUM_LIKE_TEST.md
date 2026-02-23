# Forum Like Functionality - Test & Verification

## ✅ How It Should Work

1. User clicks 🌿 like button
2. Like count increases: 0 → 1
3. Backend saves to database
4. Page refresh → Like count stays at 1 ✅

---

## 🔍 Current Implementation

### Backend (`routes/posts.js`)
```javascript
// Like endpoint
router.post('/:id/like', async (req, res) => {
  const post = await Post.findById(req.params.id);
  const userId = String(req.body.userId);
  
  if (!post.likedBy) post.likedBy = [];
  
  const hasLiked = post.likedBy.includes(userId);
  
  if (hasLiked) {
    // Unlike
    post.likedBy = post.likedBy.filter(id => String(id) !== userId);
    post.likes = Math.max(0, post.likes - 1);
  } else {
    // Like
    post.likedBy.push(userId);
    post.likes += 1;
  }
  
  await post.save();  // ✅ Saves to database
  res.json({ likes: post.likes, likedBy: post.likedBy });
});
```

### Frontend (`Forum.js`)
```javascript
const likePost = async (id) => {
  const response = await fetch(`${BACKEND_URL}/api/posts/${id}/like`, { 
    method: 'POST',
    body: JSON.stringify({ userId: currentUserId })
  });
  
  const updated = await response.json();
  setPosts((prev) =>
    prev.map((post) => (post._id === id ? 
      { ...post, likes: updated.likes, likedBy: updated.likedBy } : post
    ))
  );
};
```

---

## 🧪 Test Steps

### Test 1: Verify Like Persists
1. Go to `http://localhost:3000/forum`
2. Click 🌿 on a post
3. Count should increase: 0 → 1
4. Press `F5` to refresh
5. **Expected**: Count should still be 1 ✅
6. **If it shows 0**: There's an issue ❌

### Test 2: Check Database Directly
```bash
# Connect to MongoDB
mongosh

# Use your database
use your_database_name

# Find a post
db.posts.findOne()

# Check the likes and likedBy fields
# Should show:
# {
#   likes: 1,
#   likedBy: ["userId123"]
# }
```

### Test 3: Check Network Tab
1. Open browser DevTools (F12)
2. Go to Network tab
3. Click 🌿 like button
4. Look for POST request to `/api/posts/:id/like`
5. Check Response:
```json
{
  "likes": 1,
  "likedBy": ["userId123"]
}
```

---

## 🐛 If Likes Reset to 0 After Refresh

### Possible Causes:

**Cause 1: Backend Not Saving**
```bash
# Check backend logs
# Should see no errors when liking
```

**Cause 2: Database Connection Issue**
```javascript
// Check server.js
// MongoDB should be connected
```

**Cause 3: Post Model Issue**
```javascript
// Post.js should have:
likes: { type: Number, default: 0 },
likedBy: { type: [String], default: [] }
```

**Cause 4: Frontend Not Fetching Correctly**
```javascript
// Forum.js fetchPosts should get all data
const data = await response.json();
setPosts(data);  // Should include likes and likedBy
```

---

## ✅ Verification Checklist

- [ ] Backend server is running
- [ ] MongoDB is connected
- [ ] Post model has `likes` and `likedBy` fields
- [ ] Like endpoint saves to database (`await post.save()`)
- [ ] Frontend updates state after like
- [ ] Refresh fetches fresh data from database
- [ ] Browser console shows no errors
- [ ] Network tab shows successful POST request

---

## 🔧 Quick Fix

If likes are resetting, run this in MongoDB:

```javascript
// Check if posts have likedBy field
db.posts.find({}, { likes: 1, likedBy: 1 })

// If likedBy is missing, add it:
db.posts.updateMany(
  { likedBy: { $exists: false } },
  { $set: { likedBy: [] } }
)
```

---

## 📊 Expected Behavior

```
Initial State:
🌿 0

After Like:
🌿 1 (green background)

After Refresh:
🌿 1 (green background) ✅ PERSISTS

After Unlike:
🌿 0 (white background)
```

---

## 🎯 Summary

The like functionality SHOULD persist after refresh because:
1. ✅ Backend saves to MongoDB
2. ✅ Frontend fetches from MongoDB on refresh
3. ✅ State is updated correctly

If it's not persisting, check:
1. Backend logs for errors
2. Database connection
3. Network tab for failed requests
4. Browser console for errors
