const webpush = require('web-push');
const NotificationSubscription = require('../models/NotificationSubscription');
const Task = require('../models/Task');

// Configure web-push with VAPID keys
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDJo6MccyRiZjhqjSqXHCHuu74XG6sYS0iX642R1Jdlk',
  privateKey: process.env.VAPID_PRIVATE_KEY || 'UUxESmb9lNCaTi5a1FXvhHcdjkyBJbQGzWHzPEU5dqo'
};

webpush.setVapidDetails(
  'mailto:support@backbone.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// Send notification to user
const sendNotification = async (userId, payload) => {
  try {
    const subscriptions = await NotificationSubscription.find({ userId });
    
    if (subscriptions.length === 0) {
      return;
    }
    
    const notifications = subscriptions.map(async (sub) => {
      try {
        return await webpush.sendNotification({
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.keys.p256dh,
            auth: sub.keys.auth
          }
        }, JSON.stringify(payload));
      } catch (error) {
        // Remove invalid subscription
        if (error.statusCode === 403 || error.statusCode === 410) {
          await NotificationSubscription.deleteOne({ _id: sub._id });
        }
        throw error;
      }
    });

    await Promise.allSettled(notifications);
  } catch (error) {
    // Silent error handling
  }
};

// Check and send reminders for upcoming tasks
const checkTaskReminders = async () => {
  try {
    const now = new Date();
    const in15Minutes = new Date(now.getTime() + 15 * 60000);
    
    const upcomingTasks = await Task.find({
      date: { $gte: now, $lte: in15Minutes },
      completed: false,
      notified: { $ne: true }
    });

    for (const task of upcomingTasks) {
      
      await sendNotification(task.userId, {
        title: 'Task Reminder',
        body: `Upcoming task: ${task.text}`,
        icon: '/logo192.png',
        badge: '/logo192.png',
        tag: task._id.toString(),
        data: { taskId: task._id }
      });

      task.notified = true;
      await task.save();
    }
  } catch (error) {
    // Silent error handling
  }
};

// Start reminder scheduler (check every 1 minute for testing)
const startReminderScheduler = () => {
  setInterval(checkTaskReminders, 60000); // Check every 1 minute
  checkTaskReminders(); // Run immediately on start
};

module.exports = {
  sendNotification,
  checkTaskReminders,
  startReminderScheduler,
  vapidKeys
};
