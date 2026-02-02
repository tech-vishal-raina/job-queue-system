const jwt = require('jsonwebtoken');
const config = require('../config/config');
const logger = require('../config/logger');

class AuthMiddleware {
  verifyToken(req, res, next) {
    try {
      const token = req.headers.authorization?.split(' ')[1];

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Access token required',
        });
      }

      const decoded = jwt.verify(token, config.jwt.secret);
      req.user = decoded;
      next();
    } catch (error) {
      logger.error('Token verification failed', { error: error.message });
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }
  }

  requireRole(roles) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
        });
      }

      next();
    };
  }

  optionalAuth(req, res, next) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      
      if (token) {
        const decoded = jwt.verify(token, config.jwt.secret);
        req.user = decoded;
      }
      
      next();
    } catch (error) {
      next();
    }
  }
}

module.exports = new AuthMiddleware();