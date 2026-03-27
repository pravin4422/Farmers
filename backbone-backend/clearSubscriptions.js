const mongoose = require('mongoose');
require('dotenv').config();

const NotificationSubscription = require('./models/NotificationSubscription');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    const result = await NotificationSubscription.deleteMany({});
    console.log(`Deleted ${result.deletedCount} old subscriptions`);
    
    console.log('Done! Now resubscribe in the frontend.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
