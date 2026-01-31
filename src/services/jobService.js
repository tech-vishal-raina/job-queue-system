const queueManager = require('../queue/queueManager')
const jobRepository = require('../repositories/jobRepository');
const {JobStrategyFactory} = require('../queue/strategies/jobStrategies');
const logger = require('../config/logger');

class JobService{
    constructor(queueManager, jobRepository, strategyFactory){
        this.queueManager = queueManager;
        this.jobRepository = jobRepository;
        this.strategyFactory = strategyFactory;
    }

    async createJob(jobData, userId = null){
        try{
            const { name, priority, data, jobType} = jobData;
            
            if(!['critical','high','normal'].includes(priority)){
                throw new Error('Invalid priority. Must be critical, high, or normal');
            }

           const jobId = `${jobType}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        
           const dbJob =await this.jobRepository.createJob({
            jobId,
            name,
            priority,
            status: 'pending',
            data: {...data,jobType},
            maxAttempts: 3,
            createdBy: userId,
           });

           await this.queueManager.addJob(priority, name, {
            jobId,
            jobType,
            data,  
           }, {jobId});

           logger.info('Job created successfully', {jobId,priority,name});

           return {
            jobId: dbJob.job_id,
            name: dbJob.name,
            priority: dbJob.priority,
            status: dbJob.status,
            createdAt: dbJob.created_at,
           };
        } catch(error){
            logger.error('Error creating job', {error: error.message});
            throw error;
        }
    }

    async getJobStatus(jobId) {
        try {
            const job = await this.jobRepository.getJobById(jobId);
            if(!job){
                throw new Error('Job not found');
            }
          
        return {
            jobId: job.job_id,
            name: job.name,
            priority: job.priority,
            status: job.status,
            attempts: job.attempts,
            maxAttempts: job.max_attempts,
            result: job.result,
            errorMessage: job.error_message,
            createdAt: job>created_at,
            completedAt: job.completed_at,
        };

        }catch(error){
            logger.error('Error fetching job status', {error: error.message, jobId});
            throw error;
        }
    }
    async getJobsByStatus(status, limit = 100){
        try {
            const jobs = await this.jobRepository.getJobsByStatus(status,limit);
            return jobs.map(job => ({
              jobId: job.job_id,
              nme: job.name,
              priority: job.priority,
              status: job.status,
              createdAt: job.created_at,
            }));

        }catch(error){
            logger.error('Error fetching jobs by status', {error: error.message,status});
            throw error;
        }
    }
}

const strategyFactory = new JobStrategyFactory();
const jobService = new JobService(queueManager,jobRepository,strategyFactory);

module.exports = jobService;