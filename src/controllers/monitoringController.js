const jobService = require('../services/jobService');
const logger = require('../config/logger');

class MonitoringController {
  constructor() {
    this.clients = new Set();
  }

  streamMetrics(req, res) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    this.clients.add(res);

    logger.info('SSE client connected', { clientCount: this.clients.size });

    this.sendMetricsToClient(res);

    const intervalId = setInterval(async () => {
      await this.sendMetricsToClient(res);
    }, 5000);

    req.on('close', () => {
      clearInterval(intervalId);
      this.clients.delete(res);
      logger.info('SSE client disconnected', { clientCount: this.clients.size });
      res.end();
    });
  }

  async sendMetricsToClient(res) {
    try {
     
      const queueMetrics = await jobService.getQueueMetrics();
      
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60000);
      const systemMetrics = await jobService.getSystemMetrics(fiveMinutesAgo);

      const derived = this.calculateDerivedMetrics(queueMetrics);

      const data = {
        timestamp: new Date().toISOString(),
        queueMetrics: queueMetrics.queueMetrics,
        jobStats: queueMetrics.jobStats,
        systemMetrics,
        derived,
      };

      res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (error) {
      logger.error('Error sending metrics', { error: error.message });
    }
  }

  calculateDerivedMetrics(queueMetrics) {
    const { queueMetrics: queues, jobStats } = queueMetrics;

    let totalActive = 0;
    let totalWaiting = 0;
    let totalCompleted = 0;
    let totalFailed = 0;

    Object.values(queues).forEach(queue => {
      totalActive += queue.active || 0;
      totalWaiting += queue.waiting || 0;
      totalCompleted += queue.completed || 0;
      totalFailed += queue.failed || 0;
    });

    const total = totalCompleted + totalFailed;
    const completionRate = total > 0 ? ((totalCompleted / total) * 100).toFixed(2) : 100;

    const throughput = totalCompleted + totalFailed;

    return {
      totalActive,
      totalWaiting,
      totalCompleted,
      totalFailed,
      completionRate: parseFloat(completionRate),
      throughput,
    };
  }


  async broadcastMetrics() {
    if (this.clients.size === 0) return;

    for (const client of this.clients) {
      await this.sendMetricsToClient(client);
    }
  }


  async getDashboard(req, res) {
    try {
      const queueMetrics = await jobService.getQueueMetrics();
      const systemMetrics = await jobService.getSystemMetrics(
        new Date(Date.now() - 3600000) // Last hour
      );

      const derived = this.calculateDerivedMetrics(queueMetrics);

      res.json({
        success: true,
        data: {
          timestamp: new Date().toISOString(),
          queueMetrics: queueMetrics.queueMetrics,
          jobStats: queueMetrics.jobStats,
          systemMetrics,
          derived,
        },
      });
    } catch (error) {
      logger.error('Get dashboard error', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard data',
      });
    }
  }
}

module.exports = new MonitoringController();