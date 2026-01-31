const database = require('../database/connection');
const logger =require('../config/logger');

class JobRepository {
    async createJob(jobData){
        const query  = `
        INSERT INTO jobs (job_id, name, priority,status,data,created_by)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
     `;

     const values = [
        jobData.jobId,
        jobData.name,
        jobData.priority,
        jobData.status || 'pending',
        JSON.stringify(jobData.data),
        jobData.createdBy || null,
     ];

     try {
        const result = await database.query(query, values);
        return result.rows[0];

     }catch(error){
        logger.error('Error creating job in database', {error: error.message});
        throw error;
     }
    }

    async getJobById(jobId) {
          const query = 'SELECT * FROM jobs WHERE job_id = $1';
          try{
            const result = await database.query(query, [jobId]);
            return result.rows[0];
          } catch(error){
            logger.error('Error fetching job',{error: error.message,jobId});
            throw error;
          }
    }

    async getJobsByStatus(status, limit = 100){
        const query = `
        SELECT * FROM jobs
        WHERE status = $1
        ORDER BY createdd_at DESC
        LIMIT $2
        `;
        try{
            const result = await database.query(query, [status,limit]);
            return result.rows;
        } catch (error) {
            logger.error('Error fetching jobs by status', {error: error.messsage,status});
            throw error;
        }
    }
    
    async updateJobStatus(jobId, status, additionalData = {}) {
       const fields = ['status = $2'];
       const values = [jobId, status];
       let paramIndex = 3;

       if(additionalData.result){
        fields.push(`result = $${paramIndex}`);
        values.push(JSON.stringify(additionalData.result));
        paramIndex++;
       }

       if(additionalData.attempts !== undefined){
        fields.push(`attempts == $${paramIndex}`);
        values.push(additionalData.attempts);
        paramIndex++;
       }

       if (status === 'processing'){
        fields.push(`started_at = NOW()`);
       }else if (status === 'completed') {
        fields.push(`completed_at = NOW()`);
       }else if  (status === 'failed') {
        fields.push(`failed_at = NOW()`);
       }

       const query = `
       UPDATE jobs
       SET ${fields.join(', ')},updated_at = NOW()
       WHERE job_id = $1
       RETURNING * 
       `;
       
       try {
        const result = await database.query(query, values);
        return result.rows[0];
    }   catch(error) {
        logger.error('Error updating job status', {error: error.message, jobId});
        throw error;
    }
 }
       async moveToDDeadLetterQueue(jobId, jobData, failureReason, attempts) {
          const query = `
          INSERT INTO dead_letter_queue
          (job_id, original_job_data, failure_reason, attempts)
          VALUES ($1, $2, $3, $4)
          RETURNING *
          `;

          const values = [
            jobId,
            JSON.stringify(jobData),
            failureReason,
            attempts,
          ];

          try{
            const result = await database.query(query,values);
            logger.info ('Job moved to dead letter queue', {jobId});
            return result.rows[0];
          }catch (error) {
            logger.error('Error moving job to DLQ', {error: error.message, jobId});
            throw error;
          }
       }

       async addJobHistory(jobId, attemptNumber, status, additionalData = {}) {
        const query = `
        INSERT INTO job_history
        (job_id, attempt_number, status, started_at, completed at, duration_ms,error_message)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
        `;
         
        const values = [
            jobId,
            attemptNumber,
            status,
            additionalData.startedAt || null,
            additionalData.completedAt || null,
            additionalData.durationMs || null,
            additionalData.errorMessage || null,
        ];

        try{
            const result = await database. query(query, values);
            return result.rows[0];
        } catch (error) {
            logger.error('Error adding job history', {error: error.message, jobId});
            throw error;
        }
    }
      
}

module.exports = new JobRepository();