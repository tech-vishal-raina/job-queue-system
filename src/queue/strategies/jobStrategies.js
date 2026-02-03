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

class ReportGenerationStrategy extends JobStrategy {
  async execute(jobData) {
    logger.info('Processing report generation job', { jobData });
    await new Promise(resolve => setTimeout(resolve, 4000));
    return {
      success: true,
      reportId: `report_${Date.now()}`,
      reportType: jobData.reportType || 'standard',
      timestamp: new Date().toISOString(),
    };
  }
}

class ImageProcessingStrategy extends JobStrategy {
  async execute(jobData) {
    logger.info('Processing image job', { jobData });
    await new Promise(resolve => setTimeout(resolve, 2500));
    return {
      success: true,
      imagesProcessed: jobData.imageCount || 1,
      format: jobData.format || 'jpeg',
      timestamp: new Date().toISOString(),
    };
  }
}

class NotificationStrategy extends JobStrategy {
  async execute(jobData) {
    logger.info('Processing notification job', { jobData });
    await new Promise(resolve => setTimeout(resolve, 1500));
    return {
      success: true,
      notificationsSent: jobData.userCount || 1,
      channel: jobData.channel || 'push',
      timestamp: new Date().toISOString(),
    };
  }
}

class JobStrategyFactory {
    constructor(){
        this.strategies ={
            'email-processing': new EmailProcessingStrategy(),
            'data-processing': new DataProcessingStrategy(),
            'report-generation': new ReportGenerationStrategy(),
            'image-processing': new ImageProcessingStrategy(),
            'notification': new NotificationStrategy(),
        };
    }

    getStrategy(jobType){
        const strategy = this.strategies[jobType];
        if(!strategy){
            throw new Error(`Unknown job type: ${jobType}`);
        }
        return strategy;
    }

    getSupportedJobTypes(){
        return Object.Keys(this.strategies);
    }
}

module.exports = {JobStrategyFactory};