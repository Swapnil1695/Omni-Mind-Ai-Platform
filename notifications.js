const express = require('express');
const router = express.Router();
const notificationsController = require('../controllers/notificationsController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// GET /api/v1/notifications
router.get('/', notificationsController.getNotifications);

// POST /api/v1/notifications
router.post('/', notificationsController.createNotification);

// GET /api/v1/notifications/preferences
router.get('/preferences', notificationsController.getNotificationPreferences);

// PUT /api/v1/notifications/preferences
router.put('/preferences', notificationsController.updateNotificationPreferences);

// POST /api/v1/notifications/test
router.post('/test', notificationsController.sendTestNotification);

// PATCH /api/v1/notifications/:id/read
router.patch('/:id/read', notificationsController.markAsRead);

// PATCH /api/v1/notifications/read-all
router.patch('/read-all', notificationsController.markAllAsRead);

// DELETE /api/v1/notifications/:id
router.delete('/:id', notificationsController.deleteNotification);

// DELETE /api/v1/notifications/clear-all
router.delete('/clear-all', notificationsController.clearAllNotifications);

module.exports = router;