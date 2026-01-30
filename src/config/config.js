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

        this.postgres = {
            host: process.env.POSTGRES_HOST || 'localhost',
            port: parseInt(process.env.POSTGRES_PORT, 10) || 5432,
            user: process.env.POSTGRES_PASSWORD || 'postgres',
            password: process.env.POSTGRES_PASSWORD || 'postgres',
            database: process.env.POSTGRES_DB || 'job_queue_db',
        };
        Config.instance = this;
    }
    static getInstance(){
        if(!Config.instance){
            Config.instance = new Config();
        }
        return Config.instance;
    }
}
module.exports = Config.getInstance();