const logger = require('../config/logger');

class ErrorHandler {
  handle(err, req, res, next) {
    logger.error('Unhandled error', {
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal server error';

    res.status(statusCode).json({
      success: false,
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  }

  notFound(req, res, next) {
    res.status(404).json({
      success: false,
      message: 'Route not found',
      path: req.path,
    });
  }
}

module.exports = new ErrorHandler();