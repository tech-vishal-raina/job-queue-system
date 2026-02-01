const { Worker} = require('bullmq');
const redis = require('../queue/redis');
const logger = require('../repositories/jobRepository');
const { JobStrategyFactory } = require('../queue/strategies/jobStrategy');
const jobRepository = require('../repositories/jobRepository');

class JobWorker{
    constructor(){
        this.strategyFactory = new JobStrategyFactory();
        this.workers = {};
    }

    async processJob(job){
        const {jobId, jobType, data} = job.data;

        try{
            logger.info('Processing job', { jobId, jobType});

            await jobRepository.updateJobStatus(jobId, 'processing');

            const strategy = this.strategyFactory.getStrategy(jobType);
            const result = await strategy.execute(data);

            await jobRepository.updateJobStatus(jobId, 'completed', {result});

            logger.info('Job completed successfully', {jobId});

            return result;
        } catch (error){
            logger.error('Job processing failed', {jobId, error: error.message});

            await jobRepository.updateJobStatus(jobId, 'failed', {
                errorMessage: error.message,
            });

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
            }
        );
        worker.on('completed', (job) => {
            logger.info('Worker completed job', {jobId: job.data.jobId});
        });

        worker.on('failed', (job,err) => {
            logger.error('Worker failed job', {jobId: job?.data?.jobId, error:err.message});
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