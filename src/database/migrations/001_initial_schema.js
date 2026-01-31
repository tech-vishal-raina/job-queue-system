// src/database/migrations/001_initial_schema.js
const createTablesSQL = `
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jobs (
    id SERIAL PRIMARY KEY,
    job_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    priority VARCHAR(50) NOT NULL CHECK (priority IN ('critical','high','normal')),
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    data JSONB,
    result JSONB,
    error_message TEXT,
    attempts INT DEFAULT 0,
    max_attempts INT DEFAULT 3,
    created_by INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    failed_at TIMESTAMP
);
CREATE TABLE IF NOT EXISTS dead_letter_queue(
    id SERIAL PRIMARY KEY,
    job_id VARCHAR(255) NOT NULL,
    original_job_data JSONB NOT NULL,
    failure_reason TEXT NOT NULL,
    attempts INT NOT NULL,
    moved_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS job_history (
    id SERIAL PRIMARY KEY,
    job_id VARCHAR(255) NOT NULL,
    attempt_number INT NOT NULL,
    status VARCHAR(50) NOT NULL,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    duration_ms INT,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
 );

 CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
 CREATE INDEX IF NOT EXISTS idx_jobs_priority ON jobs(priority);
`;


module.exports = { createTablesSQL };