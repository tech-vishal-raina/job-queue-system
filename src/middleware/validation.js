const Joi = require('joi');
const logger = require('../config/logger');

class ValidationMiddleware {
  validateCreateJob(req, res, next) {
    const schema = Joi.object({
      name: Joi.string().required().min(3).max(255),
      priority: Joi.string().valid('critical', 'high', 'normal').required(),
      jobType: Joi.string().required().valid(
        'email-processing',
        'data-processing',
        'report-generation',
        'image-processing',
        'notification',
      ),
      
      data: Joi.object().required(),
    });

    const { error, value } = schema.validate(req.body);

    if (error) {
      logger.warn('Validation failed', { error: error.details[0].message });
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message,
      });
    }

    req.validatedData = value;
    next();
  }

  validateJobId(req, res, next) {
    const { jobId } = req.params;

    if (!jobId) {
      return res.status(400).json({
        success: false,
        message: 'Job ID is required',
      });
    }

    next();
  }

  validateLogin(req, res, next) {
    const schema = Joi.object({
      username: Joi.string().required().min(3).max(50),
      password: Joi.string().required().min(6),
      role: Joi.string().optional().valid('user', 'admin').default('user'),
    });

    const { error, value } = schema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message,
      });
    }

    req.validatedData = value;
    next();
  }

  validateStatus(req, res, next) {
    const { status } = req.params;
    const validStatuses = ['pending', 'processing', 'completed', 'failed'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: pending, processing, completed, failed',
      });
    }

    next();
  }

  validatePriority(req, res, next) {
    const { priority } = req.params;
    const validPriorities = ['critical', 'high', 'normal'];

    if (!validPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid priority. Must be one of: critical, high, normal',
      });
    }

    next();
  }
}

module.exports = new ValidationMiddleware();