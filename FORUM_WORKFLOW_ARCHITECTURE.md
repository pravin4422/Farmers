# Forum Feature - Complete Workflow Architecture

## 🎯 Overview
The Forum is a community feature where authenticated and public users can create posts, add comments, like posts, and interact with voice messages and file attachments.

---

## 📊 Complete Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FORUM WORKFLOW - START TO END                        │
└─────────────────────────────────────────────────────────────────────────────┘

USER ACCESS
    │
    ├─→ Public User (No Login)
    │   └─→ Can view posts, like posts
    │
    └─→ Authenticated User (Logged In)
        └─→ Can create, edit, delete own posts + add comments

┌─────────────────────────────────────────────────────────────────────────────┐
│                            1. PAGE LOAD FLOW                                 │
└─────────────────────────────────────────────────────────────────────────────┘

User navigates to /forum
        │
        ▼
Forum.js Component Mounts
        │
        ├─→ useEffect() triggers
        │   └─→ fetchPosts()
        │
        ▼
GET /api/posts
        │
        ▼
Backend: routes/posts.js
        │
        ├─→ No authentication required
        ├─→ Post.find().sort({ createdAt: -1 })
        │
        ▼
MongoDB: Posts Collection
        │
        ▼
Returns: Array of Post Objects
        │
        ▼
Frontend: setPosts(data)
        │
        ▼
UI Renders:
    ├─→ ForumForm (Create new post)
    ├─→ Search & Filter Controls
    ├─→ Sidebar (Date-grouped posts)
    └─→ ForumPost Components (List of posts)


┌─────────────────────────────────────────────────────────────────────────────┐
│                         2. CREATE POST FLOW                                  │
└─────────────────────────────────────────────────────────────────────────────┘

User fills ForumForm
    │
    ├─→ Title (Optional)
    ├─→ Content (Required - Text or Voice)
    ├─→ Tags (Optional)
    ├─→ Files (Optional - Images/PDFs)
    ├─→ Voice Message (Optional - 3 min max)
    └─→ Title Voice (Optional)
        │
        ▼
User clicks "Add Post"
        │
        ▼
ForumForm.handleSubmit()
        │
        ├─→ Validate: content.trim() || voiceBlob
        ├─→ Convert voice to Base64 (FileReader)
        ├─→ Convert files to Base64
        │
        ▼
Calls: onPost(newPost)
        │
        ▼
Forum.addPost()
        │
        ├─→ Check localStorage for token
        ├─→ If no token → Redirect to /login
        ├─→ Extract userId from token (JWT decode)
        ├─→ Prepare postData with user info
        │
        ▼
POST /api/posts
Headers: { Authorization: Bearer <token> }
Body: {
    title, content, tags, files,
    voiceMessage, titleVoiceMessage,
    userId, user: { _id, username, photoURL }
}
        │
        ▼
Backend: routes/posts.js
        │
        ├─→ protect middleware (authMiddleware)
        │   ├─→ Verify JWT token
        │   ├─→ Extract user from token
        │   └─→ Attach req.user
        │
        ▼
Controller Logic
        │
        ├─→ Override userId with authenticated user ID
        ├─→ Create Post object
        ├─→ new Post(postData)
        ├─→ savedPost.save()
        │
        ▼
MongoDB: Insert Post Document
        │
        ▼
Response: { _id, title, content, userId, user, ... }
        │
        ▼
Frontend: setPosts([savedPost, ...prev])
        │
        ▼
UI Updates: New post appears at top


┌─────────────────────────────────────────────────────────────────────────────┐
│                         3. VIEW POST FLOW                                    │
└─────────────────────────────────────────────────────────────────────────────┘

ForumPost Component Renders
        │
        ├─→ User Avatar (clickable)
        ├─→ Username (clickable)
        ├─→ Post Date
        ├─→ Title (with optional voice)
        ├─→ Content (with optional voice)
        ├─→ Files (Images/PDFs)
        ├─→ Tags
        ├─→ Like Button
        ├─→ Edit/Delete (if owner)
        └─→ Comments Section

Ownership Check:
    │
    ├─→ currentUserId = localStorage.getItem('userId')
    ├─→ postOwnerId = post.userId || post.user._id
    ├─→ isOwner = currentUserId === postOwnerId
    │
    └─→ If isOwner:
        ├─→ Show "Your Post" badge
        ├─→ Show Edit button
        └─→ Show Delete button


┌─────────────────────────────────────────────────────────────────────────────┐
│                         4. EDIT POST FLOW                                    │
└─────────────────────────────────────────────────────────────────────────────┘

User clicks "Edit" button
        │
        ▼
toggleEditPost(post._id)
        │
        ▼
Post enters edit mode
        │
        ├─→ Title → Input field
        ├─→ Content → Textarea
        ├─→ Show Save/Cancel buttons
        │
        ▼
User modifies content
        │
        ▼
User clicks "Save"
        │
        ▼
ForumPost.handleUpdate()
        │
        ▼
onUpdate(post._id, { title, content })
        │
        ▼
Forum.updatePost()
        │
        ▼
PUT /api/posts/:id
Headers: { x-user-id: currentUserId }
Body: { title, content, currentUserId }
        │
        ▼
Backend: routes/posts.js
        │
        ├─→ Find post by ID
        ├─→ Verify ownership
        │   ├─→ requestUserId = req.headers['x-user-id']
        │   ├─→ postUserId = post.userId
        │   └─→ If not match → 403 Forbidden
        │
        ├─→ Update post
        │   └─→ Post.findByIdAndUpdate()
        │
        ▼
MongoDB: Update Post Document
        │
        ▼
Response: Updated Post Object
        │
        ▼
Frontend: Update post in state
        │
        ▼
UI Updates: Post shows updated content


┌─────────────────────────────────────────────────────────────────────────────┐
│                         5. DELETE POST FLOW                                  │
└─────────────────────────────────────────────────────────────────────────────┘

User clicks "Delete" button
        │
        ▼
onDelete(post._id)
        │
        ▼
Forum.deletePost()
        │
        ▼
DELETE /api/posts/:id
Headers: { x-user-id: currentUserId }
        │
        ▼
Backend: routes/posts.js
        │
        ├─→ Find post by ID
        ├─→ Verify ownership
        │   ├─→ requestUserId = req.headers['x-user-id']
        │   ├─→ postUserId = post.userId
        │   └─→ If not match → 403 Forbidden
        │
        ├─→ Delete post
        │   └─→ Post.findByIdAndDelete()
        │
        ▼
MongoDB: Remove Post Document
        │
        ▼
Response: { message: 'Post deleted' }
        │
        ▼
Frontend: Remove post from state
        │
        ▼
UI Updates: Post disappears


┌─────────────────────────────────────────────────────────────────────────────┐
│                         6. LIKE POST FLOW                                    │
└─────────────────────────────────────────────────────────────────────────────┘

User clicks "Like" button (👍)
        │
        ▼
onLike(post._id)
        │
        ▼
Forum.likePost()
        │
        ▼
POST /api/posts/:id/like
        │
        ▼
Backend: routes/posts.js
        │
        ├─→ Find post by ID
        ├─→ Increment likes: post.likes += 1
        ├─→ post.save()
        │
        ▼
MongoDB: Update Post Document
        │
        ▼
Response: { likes: updatedCount }
        │
        ▼
Frontend: Update likes in state
        │
        ▼
UI Updates: Like count increases


┌─────────────────────────────────────────────────────────────────────────────┐
│                         7. ADD COMMENT FLOW                                  │
└─────────────────────────────────────────────────────────────────────────────┘

User types comment or records voice
        │
        ├─→ Text input
        └─→ Voice recording (3 min max)
        │
        ▼
User clicks "Add Comment"
        │
        ▼
ForumPost.handleAddComment()
        │
        ├─→ Get user info from localStorage
        │   ├─→ displayName
        │   ├─→ userEmail
        │   └─→ userId
        │
        ├─→ Convert voice to Base64 (if exists)
        │
        ├─→ Create comment object:
        │   {
        │     text, voiceMessage,
        │     userId, username, photoURL
        │   }
        │
        ▼
Update local comments state
        │
        ▼
onUpdate(post._id, { comments: newComments })
        │
        ▼
PUT /api/posts/:id
Body: { comments: [...oldComments, newComment] }
        │
        ▼
Backend: routes/posts.js
        │
        ├─→ Allow comment additions by anyone
        ├─→ Update post.comments array
        │
        ▼
MongoDB: Update Post Document
        │
        ▼
Response: Updated Post Object
        │
        ▼
Frontend: Comments updated in state
        │
        ▼
UI Updates: New comment appears


┌─────────────────────────────────────────────────────────────────────────────┐
│                         8. VOICE MESSAGE FLOW                                │
└─────────────────────────────────────────────────────────────────────────────┘

User clicks "🎤 Voice" button
        │
        ▼
Request microphone permission
        │
        ├─→ navigator.mediaDevices.getUserMedia({ audio: true })
        │
        ▼
Start recording
        │
        ├─→ MediaRecorder.start()
        ├─→ Start timer (max 3 minutes)
        ├─→ Show recording indicator
        │
        ▼
User clicks "Stop" or 3 min reached
        │
        ▼
Stop recording
        │
        ├─→ MediaRecorder.stop()
        ├─→ Create Blob (audio/webm)
        ├─→ Stop timer
        │
        ▼
Show audio preview
        │
        ├─→ <audio controls src={blobURL} />
        ├─→ Show delete button
        │
        ▼
On submit:
        │
        ├─→ Convert Blob to Base64
        │   └─→ FileReader.readAsDataURL()
        │
        ▼
Include in post/comment data
        │
        ▼
Sent to backend as Base64 string
        │
        ▼
Stored in MongoDB
        │
        ▼
Retrieved and displayed as <audio> element


┌─────────────────────────────────────────────────────────────────────────────┐
│                         9. FILE ATTACHMENT FLOW                              │
└─────────────────────────────────────────────────────────────────────────────┘

User selects files
        │
        ├─→ Images (jpg, png, etc.)
        ├─→ PDFs
        └─→ Excel/CSV files
        │
        ▼
handleFileChange()
        │
        ├─→ Array.from(e.target.files)
        ├─→ For each file:
        │   ├─→ FileReader.readAsDataURL()
        │   └─→ Create object: { name, type, data }
        │
        ▼
Store in files state
        │
        ▼
On submit: Include in post data
        │
        ▼
Sent to backend as Base64 array
        │
        ▼
Stored in MongoDB
        │
        ▼
Display in post:
        │
        ├─→ Images: <img src={data} />
        └─→ PDFs: <iframe src={data} />


┌─────────────────────────────────────────────────────────────────────────────┐
│                         10. SEARCH & FILTER FLOW                             │
└─────────────────────────────────────────────────────────────────────────────┘

Search by Text:
    │
    ├─→ User types in search box
    ├─→ setSearchTerm(value)
    ├─→ Filter posts by:
    │   ├─→ post.title.includes(searchTerm)
    │   ├─→ post.content.includes(searchTerm)
    │   └─→ post.tags.includes(searchTerm)
    │
    └─→ UI updates with filtered posts

Filter by Date:
    │
    ├─→ All Time (default)
    ├─→ Today
    ├─→ Past Week
    ├─→ Past Month
    ├─→ Past Year
    └─→ Custom Range
        │
        ├─→ User selects date filter
        ├─→ setDateFilter(value)
        ├─→ filterByDate() function
        │   └─→ Compare post.createdAt with filter
        │
        └─→ UI updates with filtered posts

Sidebar Date Navigation:
    │
    ├─→ Group posts by exact date
    ├─→ Display date list with count
    ├─→ User clicks date
    ├─→ setSelectedDate(dateKey)
    ├─→ Show only posts from that date
    │
    └─→ Delete all posts from date option


┌─────────────────────────────────────────────────────────────────────────────┐
│                         11. USER PROFILE NAVIGATION                          │
└─────────────────────────────────────────────────────────────────────────────┘

User clicks on avatar or username
        │
        ▼
handleUserClick(userId)
        │
        ├─→ Check if userId exists
        ├─→ Check if not 'guest'
        │
        ▼
navigate(`/view-profile/${userId}`)
        │
        ▼
PublicProfile page loads
        │
        └─→ Shows user's public information


┌─────────────────────────────────────────────────────────────────────────────┐
│                         12. LANGUAGE TOGGLE FLOW                             │
└─────────────────────────────────────────────────────────────────────────────┘

User clicks language toggle button
        │
        ├─→ EN ↔ தமிழ்
        │
        ▼
setLanguage(language === 'en' ? 'ta' : 'en')
        │
        ▼
All UI text updates:
        │
        ├─→ Forum title
        ├─→ Button labels
        ├─→ Placeholders
        ├─→ Filter options
        └─→ Date formats


┌─────────────────────────────────────────────────────────────────────────────┐
│                         13. ERROR HANDLING FLOW                              │
└─────────────────────────────────────────────────────────────────────────────┘

Token Expired:
    │
    ├─→ Backend returns 401
    ├─→ Frontend detects error
    ├─→ localStorage.clear()
    ├─→ Alert: "Session expired"
    └─→ Redirect to /login

Server Connection Error:
    │
    ├─→ Fetch fails
    ├─→ Catch error
    ├─→ Alert: "Cannot connect to server"
    └─→ Show error message

Validation Errors:
    │
    ├─→ Empty content
    ├─→ Alert: "Please provide content"
    └─→ Prevent submission

Permission Errors:
    │
    ├─→ Edit/Delete not owned post
    ├─→ Backend returns 403
    └─→ Show error message
```

---

## 🗄️ Database Schema

```javascript
Post Schema:
{
  _id: ObjectId,
  title: String (default: 'Voice Message'),
  content: String (default: 'Voice Message'),
  tags: [String],
  likes: Number (default: 0),
  files: [{
    name: String,
    type: String,
    data: String (Base64)
  }],
  voiceMessage: String (Base64),
  titleVoiceMessage: String (Base64),
  comments: [{
    text: String,
    voiceMessage: String (Base64),
    userId: String,
    username: String,
    photoURL: String
  }],
  createdAt: Date,
  updatedAt: Date,
  userId: String,
  user: {
    _id: String,
    username: String,
    photoURL: String
  }
}
```

---

## 🔐 Authentication & Authorization

### Public Access (No Auth):
- ✅ View all posts
- ✅ Like posts
- ❌ Create posts
- ❌ Edit posts
- ❌ Delete posts
- ❌ Add comments

### Authenticated Access (With Token):
- ✅ View all posts
- ✅ Like posts
- ✅ Create posts
- ✅ Edit own posts
- ✅ Delete own posts
- ✅ Add comments

### Ownership Verification:
```javascript
// Frontend
const currentUserId = localStorage.getItem('userId');
const postOwnerId = post.userId || post.user._id;
const isOwner = currentUserId === postOwnerId;

// Backend
const requestUserId = req.headers['x-user-id'];
const postUserId = post.userId;
if (postUserId !== requestUserId) {
  return res.status(403).json({ message: 'Forbidden' });
}
```

---

## 📡 API Endpoints Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/posts | No | Get all posts |
| POST | /api/posts | Yes | Create new post |
| PUT | /api/posts/:id | Partial | Update post (owner only) |
| DELETE | /api/posts/:id | Partial | Delete post (owner only) |
| POST | /api/posts/:id/like | No | Like a post |

---

## 🎨 Component Structure

```
Forum.js (Main Container)
    │
    ├─→ ForumForm (Create Post)
    │   ├─→ Title input + voice
    │   ├─→ Content textarea + voice
    │   ├─→ Tags input
    │   ├─→ File upload
    │   └─→ Submit button
    │
    ├─→ Search & Filter Controls
    │   ├─→ Search input
    │   └─→ Date filter dropdown
    │
    ├─→ Sidebar
    │   ├─→ Date list (grouped posts)
    │   └─→ User info
    │
    └─→ ForumPost[] (List of Posts)
        ├─→ User avatar & name
        ├─→ Post content
        ├─→ Voice messages
        ├─→ File attachments
        ├─→ Tags
        ├─→ Like button
        ├─→ Edit/Delete buttons
        └─→ Comments section
            ├─→ Comment list
            └─→ Add comment form
```

---

## 🔄 State Management

### Forum.js State:
```javascript
- posts: []              // All posts
- searchTerm: ''         // Search query
- dateFilter: 'all'      // Date filter
- customStartDate: ''    // Custom range start
- customEndDate: ''      // Custom range end
- loading: false         // Loading state
- error: null            // Error message
- language: 'en'         // UI language
- sidebarOpen: true      // Sidebar visibility
- selectedDate: null     // Selected date in sidebar
```

### ForumPost.js State:
```javascript
- editedTitle: ''        // Edit mode title
- editedContent: ''      // Edit mode content
- commentText: ''        // New comment text
- comments: []           // Post comments
- commentVoiceBlob: null // Comment voice recording
- isCommentRecording: false
- commentRecordingTime: 0
```

### ForumForm.js State:
```javascript
- title: ''              // Post title
- content: ''            // Post content
- tags: ''               // Post tags
- files: []              // Attached files
- voiceBlob: null        // Content voice
- titleVoiceBlob: null   // Title voice
- isRecording: false
- isTitleRecording: false
- recordingTime: 0
- titleRecordingTime: 0
```

---

## 🎯 Key Features

1. **Multi-format Posts**: Text, Voice, Images, PDFs
2. **Voice Recording**: 3-minute max for posts and comments
3. **File Attachments**: Images, PDFs, Excel/CSV
4. **Comments System**: Text and voice comments
5. **Like System**: Simple like counter
6. **Search & Filter**: By text and date
7. **Date Grouping**: Sidebar navigation by date
8. **Ownership Control**: Edit/delete own posts only
9. **User Profiles**: Click to view public profiles
10. **Bilingual**: English and Tamil support
11. **Responsive Sidebar**: Collapsible sidebar
12. **Real-time Updates**: Instant UI updates

---

## 🚀 Performance Optimizations

1. **Base64 Storage**: Files stored as Base64 in MongoDB
2. **Sorted Queries**: Posts sorted by createdAt descending
3. **Client-side Filtering**: Search and date filters on frontend
4. **Lazy Loading**: Audio/images loaded on demand
5. **State Management**: Efficient React state updates

---

## 🔧 Technical Stack

- **Frontend**: React, React Router, Axios
- **Backend**: Express.js, JWT
- **Database**: MongoDB, Mongoose
- **Media**: MediaRecorder API, FileReader API
- **Styling**: Custom CSS

---

**Generated**: Forum Workflow Architecture
**Version**: 1.0
**Feature**: Community Forum with Voice & File Support
