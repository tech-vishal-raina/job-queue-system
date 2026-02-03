const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const config = require('./config/config');
const logger = require('./config/logger');
const database = require('./database/connection');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

class Server {
  constructor() {
    this.app = express();
    this.port = config.app.port;
  }

  setupMiddleware() {
    this.app.use(helmet());

    this.app.use(cors());
    
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    const limiter = rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.max,
      message: 'Too many requests from this IP, please try again later',
    });
    this.app.use('/api', limiter);

    this.app.use((req, res, next) => {
      logger.info('Incoming request', {
        method: req.method,
        path: req.path,
        ip: req.ip,
      });
      next();
    });
  }

  setupRoutes() {

    this.app.use('/api', routes);

    this.app.use(errorHandler.notFound);

    this.app.use(errorHandler.handle);
  }

  async start() {
    try {
   
      logger.info('Testing database connection...');
      const dbConnected = await database.testConnection();
      
      if (!dbConnected) {
        throw new Error('Failed to connect to database');
      }

      this.setupMiddleware();
      this.setupRoutes();

      this.server = this.app.listen(this.port, () => {
        logger.info(`🚀 Server running on port ${this.port}`);
        logger.info(`📊 Environment: ${config.app.env}`);
        logger.info(`📈 Monitoring: ${config.monitoring.enabled ? 'Enabled' : 'Disabled'}`);
        logger.info('');
        logger.info('API Endpoints:');
        logger.info(`  POST   /api/auth/register`);
        logger.info(`  POST   /api/auth/login`);
        logger.info(`  GET    /api/auth/profile`);
        logger.info(`  POST   /api/jobs`);
        logger.info(`  GET    /api/jobs/:jobId`);
        logger.info(`  GET    /api/jobs/status/:status`);
        logger.info(`  GET    /api/jobs/priority/:priority`);
        logger.info(`  GET    /api/metrics/queue`);
        logger.info(`  GET    /api/metrics/system`);
        logger.info(`  GET    /api/monitoring/stream (SSE)`);
        logger.info(`  GET    /api/monitoring/dashboard`);
        logger.info('');
        logger.info('Remember to start workers: npm run worker');
      });

      this.setupGracefulShutdown();
    } catch (error) {
      logger.error('Failed to start server', { error: error.message });
      process.exit(1);
    }
  }

  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      logger.info(`${signal} received, shutting down gracefully...`);
      
      if (this.server) {
        this.server.close(async () => {
          logger.info('HTTP server closed');
          
          try {
            await database.close();
            logger.info('Database connection closed');
            process.exit(0);
          } catch (error) {
            logger.error('Error during shutdown', { error: error.message });
            process.exit(1);
          }
        });
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }
}

if (require.main === module) {
  const server = new Server();
  server.start();
}

module.exports = Server;