const { query } = require('../utils/database');
const logger = require('../utils/logger');

class TasksController {
  async getTasks(req, res) {
    try {
      const {
        project_id,
        status,
        priority,
        due_date_from,
        due_date_to,
        sort = 'due_date',
        order = 'asc',
        page = 1,
        limit = 50,
      } = req.query;

      const userId = req.user.id;
      const offset = (page - 1) * limit;

      let queryStr = `
        SELECT t.*, p.name as project_name, p.color as project_color
        FROM tasks t
        LEFT JOIN projects p ON t.project_id = p.id
        WHERE t.user_id = $1
      `;

      const params = [userId];
      let paramIndex = 2;

      if (project_id) {
        queryStr += ` AND t.project_id = $${paramIndex}`;
        params.push(project_id);
        paramIndex++;
      }

      if (status) {
        queryStr += ` AND t.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      if (priority) {
        queryStr += ` AND t.priority = $${paramIndex}`;
        params.push(priority);
        paramIndex++;
      }

      if (due_date_from) {
        queryStr += ` AND t.due_date >= $${paramIndex}`;
        params.push(due_date_from);
        paramIndex++;
      }

      if (due_date_to) {
        queryStr += ` AND t.due_date <= $${paramIndex}`;
        params.push(due_date_to);
        paramIndex++;
      }

      queryStr += ` ORDER BY t.${sort} ${order} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await query(queryStr, params);

      // Get total count for pagination
      const countResult = await query(
        'SELECT COUNT(*) FROM tasks WHERE user_id = $1',
        [userId]
      );

      res.json({
        success: true,
        tasks: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(countResult.rows[0].count),
          pages: Math.ceil(countResult.rows[0].count / limit),
        },
      });
    } catch (error) {
      logger.error('Get tasks error:', error);
      res.status(500).json({ error: 'Failed to get tasks' });
    }
  }

  async createTask(req, res) {
    try {
      const {
        project_id,
        title,
        description,
        status = 'todo',
        priority = 'medium',
        due_date,
        estimated_duration,
      } = req.body;

      const userId = req.user.id;

      // Verify project belongs to user if project_id is provided
      if (project_id) {
        const projectCheck = await query(
          'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
          [project_id, userId]
        );

        if (projectCheck.rows.length === 0) {
          return res.status(404).json({ error: 'Project not found' });
        }
      }

      const result = await query(
        `INSERT INTO tasks (
          user_id, project_id, title, description, 
          status, priority, due_date, estimated_duration
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          userId, project_id, title, description,
          status, priority, due_date, estimated_duration,
        ]
      );

      logger.info(`Task created: ${title} by user ${userId}`);

      res.status(201).json({
        success: true,
        task: result.rows[0],
      });
    } catch (error) {
      logger.error('Create task error:', error);
      res.status(500).json({ error: 'Failed to create task' });
    }
  }

  async updateTask(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;
      const userId = req.user.id;

      // Build dynamic update query
      const updateFields = [];
      const values = [];
      let paramIndex = 1;

      Object.keys(updates).forEach((key) => {
        if (key !== 'id' && key !== 'user_id' && key !== 'created_at') {
          updateFields.push(`${key} = $${paramIndex}`);
          values.push(updates[key]);
          paramIndex++;
        }
      });

      if (updateFields.length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }

      // Add updated_at
      updateFields.push('updated_at = NOW()');
      
      // Add completed_at if status changed to completed
      if (updates.status === 'completed') {
        updateFields.push('completed_at = NOW()');
      } else if (updates.status && updates.status !== 'completed') {
        updateFields.push('completed_at = NULL');
      }

      values.push(id, userId);

      const queryStr = `
        UPDATE tasks 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
        RETURNING *
      `;

      const result = await query(queryStr, values);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Task not found' });
      }

      res.json({
        success: true,
        task: result.rows[0],
      });
    } catch (error) {
      logger.error('Update task error:', error);
      res.status(500).json({ error: 'Failed to update task' });
    }
  }

  async deleteTask(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await query(
        'DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id',
        [id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Task not found' });
      }

      logger.info(`Task deleted: ${id} by user ${userId}`);

      res.json({
        success: true,
        message: 'Task deleted successfully',
      });
    } catch (error) {
      logger.error('Delete task error:', error);
      res.status(500).json({ error: 'Failed to delete task' });
    }
  }

  async completeTask(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await query(
        `UPDATE tasks 
         SET status = 'completed', completed_at = NOW(), updated_at = NOW()
         WHERE id = $1 AND user_id = $2
         RETURNING *`,
        [id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Task not found' });
      }

      res.json({
        success: true,
        task: result.rows[0],
      });
    } catch (error) {
      logger.error('Complete task error:', error);
      res.status(500).json({ error: 'Failed to complete task' });
    }
  }

  async getUpcomingTasks(req, res) {
    try {
      const { days = 7 } = req.query;
      const userId = req.user.id;

      const result = await query(
        `SELECT t.*, p.name as project_name
         FROM tasks t
         LEFT JOIN projects p ON t.project_id = p.id
         WHERE t.user_id = $1 
           AND t.status NOT IN ('completed', 'cancelled')
           AND t.due_date BETWEEN NOW() AND NOW() + INTERVAL '${days} days'
         ORDER BY t.due_date ASC
         LIMIT 20`,
        [userId]
      );

      res.json({
        success: true,
        tasks: result.rows,
      });
    } catch (error) {
      logger.error('Get upcoming tasks error:', error);
      res.status(500).json({ error: 'Failed to get upcoming tasks' });
    }
  }
}

module.exports = new TasksController();