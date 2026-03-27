const express = require('express');
const router = express.Router();
const NotificationSubscription = require('../models/NotificationSubscription');
const protect = require('../middleware/authMiddleware');
const { vapidKeys } = require('../services/notificationService');

// Get VAPID public key
router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: vapidKeys.publicKey });
});

// Subscribe to notifications
router.post('/subscribe', protect, async (req, res) => {
  try {
    const { endpoint, keys } = req.body;
    
    // Check if subscription already exists
    const existing = await NotificationSubscription.findOne({ 
      userId: req.user._id, 
      endpoint 
    });
    
    if (existing) {
      return res.json({ message: 'Already subscribed' });
    }

    const subscription = new NotificationSubscription({
      userId: req.user._id,
      endpoint,
      keys
    });

    await subscription.save();
    res.status(201).json({ message: 'Subscribed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error subscribing', error: error.message });
  }
});

// Unsubscribe from notifications
router.post('/unsubscribe', protect, async (req, res) => {
  try {
    const { endpoint } = req.body;
    
    await NotificationSubscription.deleteOne({ 
      userId: req.user._id, 
      endpoint 
    });

    res.json({ message: 'Unsubscribed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error unsubscribing', error: error.message });
  }
});

module.exports = router;
