const Redis = require('ioredis');
const config = require('../config/config');
const logger = require('../config/logger');

class RedisConnection {
    constructor(){
        if(RedisConnection.instance){
            return RedisConnection.instance;
        }

        this.client = new Redis({
            host: config.redis.host,
            port: config.redis.port,
            retryStrategy: (times) => {
                return Math.min(times * 50, 2000);
            },
        });
        this.client.on('connect', () => {
            logger.info('Redis: Connected successfully');
        });

        this.client.on('error', (err) => {
            logger.error('Redis: Connection error', {error: err.message});
        });
         
        RedisConnection.instance = this;
    }

    static getInstance(){
        if (!RedisConnection.instance) {
            RedisConnection.instance = new RedisConnection();
        }
        return RedisConnection.instance.client;
    }
}

module.exports = RedisConncetion.getInstance();