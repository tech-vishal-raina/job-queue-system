const { Worker} = require('bullmq');
const redis = require('../queue/redis');
const logger = require('../config/logger');
const { JobStrategyFactory } = require('../queue/strategies/jobStrategies');
const jobRepository = require('../repositories/jobRepository');
const config = require('../config/config');

class JobWorker{
    constructor(){
        this.strategyFactory = new JobStrategyFactory();
        this.workers = {};
        this.retryDelays = [1000, 5000, 30000];

        this.metrics = {
            processed: 0,
            failed: 0,
            startTime: Date.now(),
        };
    }

    calculateBackoff(attemptsMade){
        return this.retryDelays[Math.min(attemptsMade -1, this.retryDelays.length -1)];
    }

    async processJob(job){
        const startTime = Date.now();
        const {jobId, jobType, data} = job.data;
        const attemptNumber = job.attemptsMade +1;

        try{
            logger.info('Processing job', { 
                jobId,
                jobType,
                attempt: attemptNumber
            });

            await jobRepository.updateJobStatus ( jobId, 'processing',{
                attempts: attemptNumber,
            });

            const strategy = this.strategyFactory.getStrategy(jobType);
            const result = await strategy.execute(data);
             
            const duration = Date.now() - startTime;

            await jobRepository.updateJobStatus(jobId, 'completed', {
                result, 
                attempts: attemptNumber,
        });

            this.metrics.processed++;

            logger.info('Job completed successfully', {
                jobId,
                duration,
                attempt: attemptNumber
            });

            return result;
        } catch (error){
            const duration = Date.now() - startTime;

            logger.error('Job processing failed', 
                {jobId, 
                error: error.message,
             attempt: attemptNumber,
             duration,
            });

            this.metrics.failed++;

             if(attemptNumber >= 3)  {

                await this.handleDeadLetterQueue(jobId, job.data, error.message, attemptNumber);

                await jobRepository.updateJobStatus(jobId, 'failed', {
                    errorMessage: error.message,
                    attempts: attemptNumber,
                });
             } else {

                await jobRepository.updateJobStatus(jobId, 'retrying',{
                       errorMessage: error.message,
                       attempts: attemptNumber,
                });
                  
             }

             throw error;

        }
    }
    startMetricsReporting() {
      setInterval(() => {
      const uptime = Date.now() - this.metrics.startTime;
      const throughput = this.metrics.processed / (uptime / 1000);
      const failureRate = this.metrics.failed / (this.metrics.processed + this.metrics.failed) || 0;

      logger.info('Worker metrics', {
        processed: this.metrics.processed,
        failed: this.metrics.failed,
        throughput: throughput.toFixed(2),
        failureRate: (failureRate * 100).toFixed(2) + '%',
        uptime: Math.floor(uptime / 1000) + 's',
      });
    }, 5000); 
  }


    initializeWorker(priority){
        const queueName = `${priority}-jobs`;

        const worker = new Worker(
            queueName,
            async (job) => {
                return await this.processJob(job);
            },
            {
                connection: redis,
                concurrency: config.queue.maxJobsPerWorker,
                limiter: {
                  max: 10,
                  duration: 1000,
                },
                settings: {
                    backoffStrategy: (attemptsMade) => {
                        return this.calculateBackoff(attemptsMade);
                    },
                },
            }
        );

        worker.on('completed', (job) => {
            logger.info('Worker completed job', {jobId: job.data.jobId});
        });

        worker.on('failed', (job,err) => {
            logger.error('Worker failed job',
                 {jobId: job?.data?.jobId, 
                    error:err.message,
                       attemptsMade: job?.attemptsMade,
        });
        });

        this.workers[priority] = worker;
        logger.info('Worker initialized', {queue: queueName});
    }

    start(){
        logger.info('Starting job workers...');

        ['critical','high','normal',].forEach(priority => {
            this.initializeWorker(priority);
        });
            
        this.startMetricsReporting();

        logger.info('All workers started successfully');
    }

    async handleDeadLetterQueue(jobId, jobData, errorMessage, attempts){
        try {
            await jobRepository.moveToDDeadLetterQueue(
                jobId,
                jobData,
                errorMessage,
                attempts
            );
            logger.warn('Job moved to dead letter queue',{
                jobId,
                attempts,
                reason: errorMessage
            });
        } catch (error) {
            logger.error('Failed to move job to DLQ', {
                jobId,
                error: error.message
            });
        }
    }
}

if(require.main === module){
    const worker = new JobWorker();
    worker.start();
};


module.exports = JobWorker;