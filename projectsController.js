const { query } = require('../utils/database');
const logger = require('../utils/logger');

class ProjectsController {
  async getProjects(req, res) {
    try {
      const { status, sort = 'created_at', order = 'desc' } = req.query;
      const userId = req.user.id;

      let queryStr = `
        SELECT p.*, 
               COUNT(t.id) as task_count,
               SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_tasks
        FROM projects p
        LEFT JOIN tasks t ON p.id = t.project_id
        WHERE p.user_id = $1
      `;

      const params = [userId];
      
      if (status) {
        queryStr += ` AND p.status = $${params.length + 1}`;
        params.push(status);
      }

      queryStr += ` GROUP BY p.id ORDER BY p.${sort} ${order}`;

      const result = await query(queryStr, params);

      res.json({
        success: true,
        projects: result.rows,
        count: result.rows.length,
      });
    } catch (error) {
      logger.error('Get projects error:', error);
      res.status(500).json({ error: 'Failed to get projects' });
    }
  }

  async getProject(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await query(
        `SELECT p.*, 
                json_agg(
                  json_build_object(
                    'id', t.id,
                    'title', t.title,
                    'status', t.status,
                    'priority', t.priority,
                    'due_date', t.due_date
                  )
                ) as tasks
         FROM projects p
         LEFT JOIN tasks t ON p.id = t.project_id
         WHERE p.id = $1 AND p.user_id = $2
         GROUP BY p.id`,
        [id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Project not found' });
      }

      res.json({
        success: true,
        project: result.rows[0],
      });
    } catch (error) {
      logger.error('Get project error:', error);
      res.status(500).json({ error: 'Failed to get project' });
    }
  }

  async createProject(req, res) {
    try {
      const {
        name,
        description,
        color = '#3B82F6',
        icon = '📋',
        due_date,
      } = req.body;

      const userId = req.user.id;

      const result = await query(
        `INSERT INTO projects (user_id, name, description, color, icon, due_date)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [userId, name, description, color, icon, due_date]
      );

      logger.info(`Project created: ${name} by user ${userId}`);

      res.status(201).json({
        success: true,
        project: result.rows[0],
      });
    } catch (error) {
      logger.error('Create project error:', error);
      res.status(500).json({ error: 'Failed to create project' });
    }
  }

  async updateProject(req, res) {
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

      updateFields.push('updated_at = NOW()');
      values.push(id, userId);

      const queryStr = `
        UPDATE projects 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
        RETURNING *
      `;

      const result = await query(queryStr, values);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Project not found' });
      }

      res.json({
        success: true,
        project: result.rows[0],
      });
    } catch (error) {
      logger.error('Update project error:', error);
      res.status(500).json({ error: 'Failed to update project' });
    }
  }

  async deleteProject(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await query(
        'DELETE FROM projects WHERE id = $1 AND user_id = $2 RETURNING id',
        [id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Project not found' });
      }

      logger.info(`Project deleted: ${id} by user ${userId}`);

      res.json({
        success: true,
        message: 'Project deleted successfully',
      });
    } catch (error) {
      logger.error('Delete project error:', error);
      res.status(500).json({ error: 'Failed to delete project' });
    }
  }

  async getProjectStats(req, res) {
    try {
      const userId = req.user.id;

      const result = await query(
        `SELECT 
           status,
           COUNT(*) as count,
           COUNT(CASE WHEN due_date < NOW() THEN 1 END) as overdue
         FROM projects 
         WHERE user_id = $1
         GROUP BY status`,
        [userId]
      );

      res.json({
        success: true,
        stats: result.rows,
      });
    } catch (error) {
      logger.error('Get project stats error:', error);
      res.status(500).json({ error: 'Failed to get project stats' });
    }
  }
}

module.exports = new ProjectsController();