const database = require('../connection');
const logger = require('../../config/logger');
const bcrypt = require('bcryptjs');

async function seedUsers(){
    logger.info('Seeding users...');

    const passwordHash = await bcrypt.hash('password123',10);

    const users = [
        { username: 'admin', password_hash: passwordHash, role: 'admin',},
        { username: 'user1', password_hash: passwordHash, role: 'user',},
        { username: 'user2', password_hash: passwordHash, role: 'user',},
    ];

    for(const user of users){
        try{
            await database.query(
                'INSERT INTO users (username, password_hash,role) VALUES ($1, $2, $3) ON CONFLICT (username) DO NOTHING',
                [user.username, user.password_hash, user.role]
            );
            logger.info(`User created: ${user.username}`);
        } catch(error) {
            logger.error(`Failed to create user: ${user.username}`, { error: error.message });
        }
    }
}

async function seedJobs(){
    logger.info('Seeding sample jobs...');

    const sampleJobs = [
        {
            job_id: 'email-sample-1',
            name: 'Welcome Email Campaign',
            priority: 'high',
            status: 'pending',
            data: JSON.stringify({
                jobType: 'email-processing',
                recipients: ['user1@example.com', 'user2@example.com'],
                subject: 'Welcome to Our Service',
            }),
        },
        {
            job_id: 'data-sample-1',
            name: 'Daily Data Processing',
            priority: 'normal',
            status: 'pending',
            data: JSON.stringify({
                jobType: 'data-processing',
                recordCount: 5000,
                source: 'daily_export',
            }),
        },
    ];

    for(const job of sampleJobs){
        try{
            await database.query(
                `INSERT INTO jobs (job_id, name, priority, status, data)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (job_id) DO NOTHING`,
                [job.job_id, job.name, job.priority,job.status,job.data]
            );
            logger.info(`Job created: ${job.name}`);
        } catch(error){
            logger.error('Failed to create job: ${job.name}', {error: error.message});
        }
    }
}

async function main(){
    try{
        logger.info('Starting seed process');

        const connected = await database.testConnection();
        if(!connected){
            throw new Error('failed to connect to database');
        }

        await seedUsers();
        await seedJobs();

        logger.info('Seed process completed successfully');

        logger.info('\nTest Credentials:');
        logger.info(' Username: admin | Password: password123');
        logger.info('Username: user1 | Password: password123');

        process.exit(0);
    }   catch(error){
        logger.error('Seed process failed', {error: error.message});
        process.exit(1);
    }
}

main();
