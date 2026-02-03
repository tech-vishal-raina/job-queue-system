const winston = require('winston');
const config = require('./config');

class Logger{
    constructor(){
        if(Logger.instance){
            return Logger.instance;
        }

        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            transports: [
                new winston.transports.Console({
                    format: winston.format.simple(),
                }),
            ],
        });

        Logger.instance = this;
    }

    static getInstance(){
        if(!Logger.instance){
            Logger.instance = new Logger();
        }
        return Logger.instance.logger;
    }
}

module.exports = Logger.getInstance();