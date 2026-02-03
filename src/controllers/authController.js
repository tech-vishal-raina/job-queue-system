const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const database = require('../database/connection');
const config = require('../config/config');
const logger = require('../config/logger');

class AuthController {
  async register(req, res) {
    try {
      const { username, password, role = 'user' } = req.validatedData || req.body;

      const existingUser = await database.query(
        'SELECT id FROM users WHERE username = $1',
        [username]
      );

      if (existingUser.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Username already exists',
        });
      }
      const passwordHash = await bcrypt.hash(password, 12);

       const result = await database.query(
        'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING id, username, role, created_at',
        [username, passwordHash, role]
      );

      const user = result.rows[0];

      logger.info('User registered', { userId: user.id, username: user.username });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
      });
    } catch (error) {
      logger.error('Registration error', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Registration failed',
      });
    }
  }

  async login(req, res) {
    try {
      const { username, password } = req.validatedData;

      const result = await database.query(
        'SELECT id, username, password_hash, role FROM users WHERE username = $1',
        [username]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      const user = result.rows[0];

      const validPassword = await bcrypt.compare(password, user.password_hash);

      if (!validPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
          role: user.role,
        },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      logger.info('User logged in', { userId: user.id, username: user.username });

      res.json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
      });
    } catch (error) {
      logger.error('Login error', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Login failed',
      });
    }
  }

  async getProfile(req, res) {
    try {
      const userId = req.user.id;

      const result = await database.query(
        'SELECT id, username, role, created_at FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      res.json({
        success: true,
        user: result.rows[0],
      });
    } catch (error) {
      logger.error('Get profile error', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to fetch profile',
      });
    }
  }
}

module.exports = new AuthController();
