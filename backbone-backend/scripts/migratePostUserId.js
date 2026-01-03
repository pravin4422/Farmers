const mongoose = require('mongoose');
require('dotenv').config();

const Post = require('../models/Post');

async function migratePostUserId() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const posts = await Post.find({});

    let updated = 0;
    for (const post of posts) {
      if (!post.userId && post.user?._id) {
        post.userId = post.user._id;
        await post.save();
        updated++;
      }
    }

    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
}

migratePostUserId();
