require('dotenv').config();

class Config{
    constructor(){
        if(Config.instance){
            return Config.instance;
        }

        this.app = {
            env: process.env.NODE_ENV || 'development',
            port: parseInt(process.env.PORT,10) || 3000,
        };

        this.redis = {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT, 10) || 6379,
        };

        this.postgres = {
            host: process.env.POSTGRES_HOST || 'localhost',
            port: parseInt(process.env.POSTGRES_PORT, 10) || 5432,
            user: process.env.POSTGRES_USER || 'postgres',
            password: process.env.POSTGRES_PASSWORD || 'postgres',
            database: process.env.POSTGRES_DB || 'job_queue_db',
        };

        this.queue= {
            maxJobsPerWorker: parseInt(process.env.MAX_JOBS_PER_WORKER, 10) || 5,
            JobTimeout: parseInt(process.env.JOB_TIMEOUT, 10) || 30000,
            retryStrategy: {
                attempts: 3,
                delays: [1000, 5000, 30000],
            },
        };

        this.rateLimit = {
            windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
            max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100, // limit each IP to 100 requests per windowMs
        };

        this.monitoring = {
            enabled: process.env.MONITORING_ENABLED === 'true' || true,
        };

        Config.instance = this;

        this.jwt = {
        secret: process.env.JWT_SECRET || 'default-secret-change-me',
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
};
    }
    static getInstance(){
        if(!Config.instance){
            Config.instance = new Config();
        }
        return Config.instance;
    }
}
module.exports = Config.getInstance();