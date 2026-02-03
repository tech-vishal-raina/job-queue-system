const {Queue} = require('bullmq');
const redis = require('./redis');
const logger = require('../config/logger');

class QueueBuilder {
    constructor(name){
        this.queueName = name;
        this.queueOptions = {
            connection: redis,
            defaultJobOptions: {},
        };
    }

    withPriority(priority){
        const priorityMap ={ critical: 1, high: 2, normal: 3};
        this.queueOptions.defaultJobOptions.priority = priorityMap[priority];
        return this;
    }
    withTimeout(timeout){
        this.queueOptions.defaultJobOptions.timeout = timeout;
        return this;
    }
    build(){
        return new Queue(this.queueName,this.queueOptions);
    }
}

class QueueManager{
    constructor(){
        if(QueueManager.instance){
            return QueueManager.instance;
        }

        this.queues ={};
        this.initializeQueues();

        QueueManager.instance = this;
    }

    static getInstance() {
        if(!QueueManager.instance){
            QueueManager.instance = new QueueManager();
        }
        return QueueManager.instance;
    }

    initializeQueues(){
        this.queues.critical = new QueueBuilder('critical-jobs')
        .withPriority('critical')
        .withTimeout(30000)
        .build();

        this.queues.high = new QueueBuilder('high-jobs')
        .withPriority('high')
        .withTimeout(30000)
        .build();

        this.queues.normal = new QueueBuilder('normal-jobs')
        .withPriority('normal')
        .withTimeout(30000)
        .build();

        logger.info('Queues initialized');
    }
    
    getQueue(priority){
        return this.queues[priority];
    }

    async addJob(priority, jobName, jobData){
        const queue = this.getQueue(priority);
        const job = await queue.add(jobName, jobData);
        logger.info('Job added to queue',{jobId: job.id,priority});
        return job;
    }

    async getQueueMetrics(){
        try {
            const metrics = {};
            for (const [priority, queue] of Object.entries(this.queues)) {
                const waiting = await queue.getWaiting();
                const active = await queue.getActive();
                const completed = await queue.getCompleted();
                const failed = await queue.getFailed();
                
                metrics[priority] = {
                    waiting: waiting.length,
                    active: active.length,
                    completed: completed.length,
                    failed: failed.length,
                };
            }
            return metrics;
        } catch (error) {
            logger.error('Error fetching queue metrics', {error: error.message});
            throw error;
        }
    }
}

module.exports = QueueManager.getInstance();