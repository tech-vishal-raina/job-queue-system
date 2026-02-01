const { Worker} = require('bullmq');
const redis = require('../queue/redis');
const logger = require('../repositories/jobRepository');
const { JobStrategyFactory } = require('../queue/strategies/jobStrategy');
const jobRepository = require('../repositories/jobRepository');

class JobWorker{
    constructor(){
        this.strategyFactory = new JobStrategyFactory();
        this.workers = {};

        this.retryDelays = [1000, 5000, 30000];
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

            logger.info('Job completed successfully', {
                jobId,
                duration,
                attempt: attemptNumber
            });

            return result;
        } catch (error){
            logger.error('Job processing failed', 
                {jobId, 
                error: error.message,
             attempt: attemptNumber,});

             if(attemptNumber >= 3)  {
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

    initializeWorker(priority){
        const queueName = `${priority}-jobs`;

        const worker = new Worker(
            queueName,
            async (job) => {
                return await this.processJob(job);
            },
            {
                connection: redis,
                concurrency: 5,
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

        logger.info('All workers started successfully');
    }
}

if(require.main === module){
    const worker = new JobWorker();
    worker.start();
}

module.exports = JobWorker;