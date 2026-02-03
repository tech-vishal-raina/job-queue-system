const jobService = require('../services/jobService');
const logger = require('../config/logger');

class JobController {
  async createJob(req, res) {
    try {
      const userId = req.user?.id;
      const jobData = req.validatedData;

      const job = await jobService.createJob(jobData, userId);

      res.status(201).json({
        success: true,
        message: 'Job created successfully',
        job,
      });
    } catch (error) {
      logger.error('Create job error', { error: error.message });
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create job',
      });
    }
  };

  async getJobStatus (req, res) {
    try {
      const { jobId } = req.params;

      const job = await jobService.getJobStatus(jobId);

      res.json({
        success: true,
        job,
      });
    } catch (error) {
      logger.error('Get job status error', { error: error.message });
      
      if (error.message === 'Job not found') {
        return res.status(404).json({
          success: false,
          message: 'Job not found',
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to fetch job status',
      });
    }
  }

  async getJobsByStatus(req, res) {
    try {
      const { status } = req.params;
      const limit = parseInt(req.query.limit) || 100;

      const jobs = await jobService.getJobsByStatus(status, limit);

      res.json({
        success: true,
        count: jobs.length,
        jobs,
      });
    } catch (error) {
      logger.error('Get jobs by status error', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to fetch jobs',
      });
    }
  }

  async getJobsByPriority(req, res) {
    try {
      const { priority } = req.params;
      const limit = parseInt(req.query.limit) || 100;

      const jobs = await jobService.getJobsByPriority(priority, limit);

      res.json({
        success: true,
        count: jobs.length,
        jobs,
      });
    } catch (error) {
      logger.error('Get jobs by priority error', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to fetch jobs',
      });
    }
  }

  async getQueueMetrics(req, res) {
    try {
      const metrics = await jobService.getQueueMetrics();

      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        metrics,
      });
    } catch (error) {
      logger.error('Get queue metrics error', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to fetch queue metrics',
      });
    }
  }

  async getSystemMetrics(req, res) {
    try {
      
      const hoursAgo = parseInt(req.query.hours) || 1;
      const since = new Date(Date.now() - hoursAgo * 3600000);

      const metrics = await jobService.getSystemMetrics(since);

      res.json({
        success: true,
        metrics,
        period: `Last ${hoursAgo} hour(s)`,
      });
    } catch (error) {
      logger.error('Get system metrics error', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to fetch system metrics',
      });
    }
  }
}

module.exports = new JobController();