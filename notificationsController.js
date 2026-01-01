const { query } = require('../utils/database');
const logger = require('../utils/logger');

class NotificationsController {
  async getNotifications(req, res) {
    try {
      const { read, type, limit = 50, offset = 0 } = req.query;
      const userId = req.user.id;

      let queryStr = `
        SELECT * FROM notifications 
        WHERE user_id = $1
      `;
      
      const params = [userId];
      let paramIndex = 2;

      if (read !== undefined) {
        queryStr += ` AND read = $${paramIndex}`;
        params.push(read === 'true');
        paramIndex++;
      }

      if (type) {
        queryStr += ` AND type = $${paramIndex}`;
        params.push(type);
        paramIndex++;
      }

      queryStr += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(parseInt(limit), parseInt(offset));

      const result = await query(queryStr, params);

      // Get total count for unread
      const unreadResult = await query(
        'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND read = false',
        [userId]
      );

      res.json({
        success: true,
        notifications: result.rows,
        unreadCount: parseInt(unreadResult.rows[0].count),
      });
    } catch (error) {
      logger.error('Get notifications error:', error);
      res.status(500).json({ error: 'Failed to get notifications' });
    }
  }

  async markAsRead(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await query(
        'UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2 RETURNING *',
        [id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Notification not found' });
      }

      res.json({
        success: true,
        notification: result.rows[0],
      });
    } catch (error) {
      logger.error('Mark notification as read error:', error);
      res.status(500).json({ error: 'Failed to mark notification as read' });
    }
  }

  async markAllAsRead(req, res) {
    try {
      const userId = req.user.id;

      await query(
        'UPDATE notifications SET read = true WHERE user_id = $1 AND read = false',
        [userId]
      );

      res.json({
        success: true,
        message: 'All notifications marked as read',
      });
    } catch (error) {
      logger.error('Mark all notifications as read error:', error);
      res.status(500).json({ error: 'Failed to mark notifications as read' });
    }
  }

  async deleteNotification(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await query(
        'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id',
        [id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Notification not found' });
      }

      res.json({
        success: true,
        message: 'Notification deleted successfully',
      });
    } catch (error) {
      logger.error('Delete notification error:', error);
      res.status(500).json({ error: 'Failed to delete notification' });
    }
  }

  async clearAllNotifications(req, res) {
    try {
      const userId = req.user.id;

      await query(
        'DELETE FROM notifications WHERE user_id = $1',
        [userId]
      );

      res.json({
        success: true,
        message: 'All notifications cleared',
      });
    } catch (error) {
      logger.error('Clear all notifications error:', error);
      res.status(500).json({ error: 'Failed to clear notifications' });
    }
  }

  async getNotificationPreferences(req, res) {
    try {
      const userId = req.user.id;

      const result = await query(
        `SELECT up.notification_settings, up.ai_preferences, up.theme
         FROM user_preferences up
         WHERE up.user_id = $1`,
        [userId]
      );

      let preferences = result.rows[0];
      
      if (!preferences) {
        // Create default preferences
        preferences = {
          notification_settings: {
            email: true,
            push: true,
            sms: false,
            dailyDigest: true,
            quietHours: { enabled: false, start: "22:00", end: "08:00" }
          },
          ai_preferences: {
            autoExtractTasks: true,
            autoSchedule: true,
            smartPrioritization: true,
            language: "en"
          },
          theme: "light"
        };
      }

      res.json({
        success: true,
        preferences,
      });
    } catch (error) {
      logger.error('Get notification preferences error:', error);
      res.status(500).json({ error: 'Failed to get preferences' });
    }
  }

  async updateNotificationPreferences(req, res) {
    try {
      const userId = req.user.id;
      const updates = req.body;

      const result = await query(
        `INSERT INTO user_preferences (user_id, notification_settings, ai_preferences, theme)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id) 
         DO UPDATE SET 
           notification_settings = COALESCE($2, user_preferences.notification_settings),
           ai_preferences = COALESCE($3, user_preferences.ai_preferences),
           theme = COALESCE($4, user_preferences.theme),
           updated_at = NOW()
         RETURNING *`,
        [
          userId,
          updates.notification_settings,
          updates.ai_preferences,
          updates.theme,
        ]
      );

      res.json({
        success: true,
        preferences: result.rows[0],
      });
    } catch (error) {
      logger.error('Update notification preferences error:', error);
      res.status(500).json({ error: 'Failed to update preferences' });
    }
  }

  async createNotification(req, res) {
    try {
      const {
        type,
        title,
        message,
        priority = 'medium',
        action_url,
        metadata = {},
        scheduled_for,
      } = req.body;

      const userId = req.user.id;

      const result = await query(
        `INSERT INTO notifications (
          user_id, type, title, message, priority, 
          action_url, metadata, scheduled_for
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          userId, type, title, message, priority,
          action_url, metadata, scheduled_for,
        ]
      );

      // Emit real-time notification via WebSocket if needed
      // (implement WebSocket logic separately)

      res.status(201).json({
        success: true,
        notification: result.rows[0],
      });
    } catch (error) {
      logger.error('Create notification error:', error);
      res.status(500).json({ error: 'Failed to create notification' });
    }
  }

  async sendTestNotification(req, res) {
    try {
      const userId = req.user.id;
      
      const result = await query(
        `INSERT INTO notifications (
          user_id, type, title, message, priority, action_url
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *`,
        [
          userId,
          'test',
          'Test Notification',
          'This is a test notification from OmniMind.',
          'medium',
          '/dashboard'
        ]
      );

      logger.info(`Test notification sent to user ${userId}`);

      res.json({
        success: true,
        notification: result.rows[0],
        message: 'Test notification sent successfully',
      });
    } catch (error) {
      logger.error('Send test notification error:', error);
      res.status(500).json({ error: 'Failed to send test notification' });
    }
  }
}

module.exports = new NotificationsController();