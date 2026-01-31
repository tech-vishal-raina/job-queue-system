const database = require('../database/connection');
const logger =require('../config/logger');

class JobRepository {
    async createJob(jobData){
        const query  = `
        INSERT INTO jobs (job_id, name, priority,status,data)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
     `;

     const values = [
        jobData.jobId,
        jobData.name,
        jobData.priority,
        jobData.status || 'pending',
        JSON.stringify(jobData.data),
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
}

module.exports = new JobRepository();