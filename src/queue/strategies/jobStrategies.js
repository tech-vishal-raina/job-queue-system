const logger = require('../../config/logger');

class JobStrategy {
    async execute(jobData){
        throw new Error('execute() must be implemented');
    }
}

class EmailProcessingStrategy extends JobStrategy {
    async execute(jobData){
        logger.info('Processing email job', {jobData});
        await new Promise(resolve => setTimeout(resolve, 2000));
        return {
            success: true,
            emailsSent: jobData.recipients?.length || 1,
        };
    }
}

class DataProcessingStrategy extends JobStrategy {
    async execute(jobData){
        logger.info('Processing data job', { jobData});
        await new Promise(resolve => setTimeout(resolve,3000));
        return{
            success: true,
            recordsProcessed: jobData.recordCount || 100,
        };
    }
}

class JobStrategyFactory {
    constructor(){
        this.strategies ={
            'email-processing': new EmailProcessingStrategy(),
            'data-processing': new DataProcessingStrategy(),
        };
    }

    getStrategy(jobType){
        const strategy = this.strategies[jobType];
        if(!strategy){
            throw new Error(`Unknown job type: ${jobType}`);
        }
        return strategy;
    }
}

module.exports = {JobStrategyFactory};