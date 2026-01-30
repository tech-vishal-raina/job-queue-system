const {Queue} = require('bullmq');
const redis = require('./redis');
const logger = require('/config/logger');

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
        ['critical','high','normal',].forEach(priority => {
            this.queues[priority] = new Queue(`${priority}-jobs`,{
                connection: redis,
            });
        });

        logger.info('Queues initialized')
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
}

module.exports = QueueManager.getInstance();