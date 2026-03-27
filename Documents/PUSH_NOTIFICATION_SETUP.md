# Push Notification Setup for Task Reminders

## Overview
The system now sends push notifications to farmers' phones when task reminders are due (15 minutes before the scheduled time).

## Backend Setup

### 1. Install Dependencies
```bash
cd backbone-backend
npm install
```

### 2. Environment Variables
VAPID keys are already added to `.env`:
- VAPID_PUBLIC_KEY
- VAPID_PRIVATE_KEY

### 3. Start Server
```bash
npm start
```

The notification scheduler will automatically start and check for upcoming tasks every 5 minutes.

## Frontend Setup

### 1. Service Worker
The service worker is located at `frontend/public/service-worker.js` and handles incoming push notifications.

### 2. Enable Notifications
Users can enable/disable notifications by clicking the bell icon in the reminder page header.

## How It Works

### Backend Flow
1. **Scheduler**: Runs every 5 minutes checking for tasks due in the next 15 minutes
2. **Notification Service**: Sends push notifications to all subscribed devices for the user
3. **Task Tracking**: Marks tasks as `notified: true` to prevent duplicate notifications

### Frontend Flow
1. **Service Worker Registration**: Automatically registers when reminder page loads
2. **Permission Request**: User clicks bell icon to enable notifications
3. **Subscription**: Device subscribes to push notifications via Web Push API
4. **Notification Display**: Browser shows notification when received
5. **Click Action**: Clicking notification opens the reminders page

## API Endpoints

### GET /api/notifications/vapid-public-key
Returns the VAPID public key for push subscription.

### POST /api/notifications/subscribe
Subscribes user's device to push notifications.
**Headers**: Authorization: Bearer {token}
**Body**: 
```json
{
  "endpoint": "https://...",
  "keys": {
    "p256dh": "...",
    "auth": "..."
  }
}
```

### POST /api/notifications/unsubscribe
Unsubscribes user's device from push notifications.
**Headers**: Authorization: Bearer {token}
**Body**: 
```json
{
  "endpoint": "https://..."
}
```

## Database Changes

### Task Model
Added `notified` field (Boolean, default: false) to track notification status.

### NotificationSubscription Model
New model to store push notification subscriptions:
- userId: Reference to User
- endpoint: Push service endpoint
- keys: Encryption keys (p256dh, auth)

## User Experience

1. User opens reminder page
2. Clicks bell icon to enable notifications
3. Browser requests notification permission
4. User grants permission
5. Device subscribes to push notifications
6. When a task is due in 15 minutes, user receives notification on their phone
7. Clicking notification opens the reminder page

## Browser Support
- Chrome/Edge: Full support
- Firefox: Full support
- Safari: iOS 16.4+ and macOS 13+
- Opera: Full support

## Testing

### Test Notification Flow
1. Create a task with date/time 15 minutes in the future
2. Enable notifications in reminder page
3. Wait for notification (scheduler checks every 5 minutes)
4. Notification should appear on device

### Manual Test
You can manually trigger notifications by calling the notification service in backend.

## Notes
- Notifications only work over HTTPS in production (localhost works for development)
- Users must grant browser notification permission
- Service worker must be registered for push notifications to work
- Scheduler runs continuously while server is running
