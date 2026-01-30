const {Pool} = require('pg');
const config = require('../config/config.js');
const config = require('../config/logger.js');

class Database {
    constructor() {
        if(Database.instance) {
            return Database.instance;
        }

        this.pool = new Pool({
            host: config.postgres.host,
            port: config.postgres.port,
            user: config.postgres.user,
            password: config.postgres.password,
            database: config.postgres.database,
            max:20,
        });

        Database.instance = this;
    }

    static getInstance() {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

    async query(text, params){
        try{
            const result = await this.pool.query(text,params);
            return result;
        } catch(error){
            logger.error('Database query error',{error:error.message});
            throw error;
        }
    }

    async testConnection(){
        try{
            const result = await this.query('SELECT NOW()');
            logger.info('PostgreSQL: Connection successful');
            return true;    
        } catch(error){
            logger.error('PostgreSQL: Connection failed',{error:error.message});
            return false;
        }
    }
}

module.exports = Database.getInstance();