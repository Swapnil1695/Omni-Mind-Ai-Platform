const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query } = require('../utils/database');
const encryption = require('../utils/encryption');
const logger = require('../utils/logger');

class AuthController {
  async register(req, res) {
    try {
      const { email, password, name, timezone = 'UTC' } = req.body;

      // Check if user exists
      const existingUser = await query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Create user
      const result = await query(
        `INSERT INTO users (email, name, password_hash, timezone)
         VALUES ($1, $2, $3, $4)
         RETURNING id, email, name, avatar_url, timezone, created_at`,
        [email, name, passwordHash, timezone]
      );

      const user = result.rows[0];

      // Generate JWT
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      logger.info(`New user registered: ${email}`);

      res.status(201).json({
        success: true,
        user,
        token,
      });
    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Find user
      const userResult = await query(
        'SELECT id, email, name, password_hash, avatar_url, timezone FROM users WHERE email = $1',
        [email]
      );

      if (userResult.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = userResult.rows[0];

      // Verify password
      const isValid = await bcrypt.compare(password, user.password_hash);
      
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate JWT
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      // Remove password hash from response
      delete user.password_hash;

      logger.info(`User logged in: ${email}`);

      res.json({
        success: true,
        user,
        token,
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }

  async me(req, res) {
    try {
      res.json({
        success: true,
        user: req.user,
      });
    } catch (error) {
      logger.error('Get user error:', error);
      res.status(500).json({ error: 'Failed to get user info' });
    }
  }

  async updateProfile(req, res) {
    try {
      const { name, timezone, avatar_url } = req.body;
      
      const result = await query(
        `UPDATE users 
         SET name = COALESCE($1, name),
             timezone = COALESCE($2, timezone),
             avatar_url = COALESCE($3, avatar_url),
             updated_at = NOW()
         WHERE id = $4
         RETURNING id, email, name, avatar_url, timezone`,
        [name, timezone, avatar_url, req.user.id]
      );

      res.json({
        success: true,
        user: result.rows[0],
      });
    } catch (error) {
      logger.error('Update profile error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }

  async refreshToken(req, res) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ error: 'Token required' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Generate new token
      const newToken = jwt.sign(
        { userId: decoded.userId, email: decoded.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      res.json({
        success: true,
        token: newToken,
      });
    } catch (error) {
      logger.error('Refresh token error:', error);
      res.status(401).json({ error: 'Invalid token' });
    }
  }
}

module.exports = new AuthController();