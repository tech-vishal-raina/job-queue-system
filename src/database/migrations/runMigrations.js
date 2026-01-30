const database = require('../connection');
const logger = require('../../config/logger');
const {createTablesSQL} = require('./001_initial_schema');

async function runMigrations(){
    try{
        logger.info('Starting database migrations...');

        const connected = await database.testConnection();
        if(!connected){
            throw new Error('Failed to connect to database');
        }
        
        await database.query(createTablesSQL);
        logger.info('Database migrations completed successfully');

        process.exit(0);
    }catch(error){
        logger.error('Migration failed',{error: error.message});
        process.exit(1);
    }
}

runMigrations();