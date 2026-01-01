const mongoose = require('mongoose');
require('dotenv').config();

const Post = require('../models/Post');

async function migratePostUserId() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const posts = await Post.find({});
    console.log(`Found ${posts.length} posts`);

    let updated = 0;
    for (const post of posts) {
      if (!post.userId && post.user?._id) {
        post.userId = post.user._id;
        await post.save();
        updated++;
        console.log(`Updated post ${post._id} with userId: ${post.userId}`);
      }
    }

    console.log(`Migration complete. Updated ${updated} posts.`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migratePostUserId();
