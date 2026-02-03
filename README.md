# Distributed Job Queue System

A production-ready distributed job queue system built with Node.js, Redis, BullMQ, and PostgreSQL.

## Features
- High-throughput async job processing
- Priority-based queue management (critical/high/normal)
- Real-time monitoring with metrics
- 3-tier retry with exponential backoff

## Prerequisites
- Node.js (v16+)
- PostgreSQL (v12+)
- Redis (v6+)

## Installation

1. Install dependencies:
npm install

2. Create database:
psql -U postgres -c "CREATE DATABASE job_queue_db;"

3. Run migrations:
npm run migrate

## Running the Application
Coming soon...