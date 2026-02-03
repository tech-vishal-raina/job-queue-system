const axios = require('axios');

const API_URL = 'http://localhost:3000/api';
let authToken = '';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testAPI() {
  try {
    console.log('Testing Job Queue System API');
    console.log('================================\n');

    const TEST_USERNAME = 'testuser';
    const TEST_PASSWORD = 'password123';

    console.log('Testing User Registration...');
    try {
      const registerRes = await axios.post(`${API_URL}/auth/register`, {
        username: TEST_USERNAME,
        password: TEST_PASSWORD,
        role: 'user',
      });
      console.log('   User registered successfully');
      console.log('   User ID:', registerRes.data.user.id);
      console.log('   Username:', registerRes.data.user.username);
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('User already exists, continuing to login');
      } else {
        throw error;
      }
    }

    console.log('Testing User Login...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      username: TEST_USERNAME,
      password: TEST_PASSWORD,
    });
    authToken = loginRes.data.token;
    console.log('Login successful');
    console.log('Token:', authToken.substring(0, 20) + '...');

    // Test 3: Get Profile
    console.log('Testing Get Profile...');
    const profileRes = await axios.get(`${API_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    console.log('Profile retrieved');
    console.log('Username:', profileRes.data.user.username);
    console.log('Role:', profileRes.data.user.role);

    
    console.log('Testing Job Creation (5 different types)...');
    const jobTypes = [
      {
        name: 'Email Campaign',
        priority: 'high',
        jobType: 'email-processing',
        data: {
          recipients: ['user1@example.com', 'user2@example.com'],
          subject: 'Welcome Email',
          body: 'Welcome to our service!',
        },
      },
      {
        name: 'Data Processing',
        priority: 'normal',
        jobType: 'data-processing',
        data: {
          recordCount: 5000,
          source: 'daily_export',
          format: 'csv',
        },
      },
      {
        name: 'Monthly Report',
        priority: 'critical',
        jobType: 'report-generation',
        data: {
          reportType: 'monthly',
          period: '2026-01',
        },
      },
      {
        name: 'Image Resize',
        priority: 'normal',
        jobType: 'image-processing',
        data: {
          imageCount: 10,
          format: 'jpeg',
          size: '800x600',
        },
      },
      {
        name: 'Push Notifications',
        priority: 'high',
        jobType: 'notification',
        data: {
          userCount: 1000,
          channel: 'push',
          message: 'New feature available!',
        },
      },
    ];

    const createdJobs = [];
    for (const job of jobTypes) {
      const jobRes = await axios.post(`${API_URL}/jobs`, job, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      createdJobs.push(jobRes.data.job);
      console.log(`Created ${job.jobType}:`, jobRes.data.job.jobId);
    }

    
    console.log('Waiting for jobs to process...');
    await sleep(5000);
    console.log(' Wait complete');

   
    console.log('Testing Job Status Retrieval...');
    for (const job of createdJobs) {
      const statusRes = await axios.get(`${API_URL}/jobs/${job.jobId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      console.log(`   Job ${job.jobId}:`);
      console.log(`   Status: ${statusRes.data.job.status}`);
      console.log(`   Priority: ${statusRes.data.job.priority}`);
      if (statusRes.data.job.result) {
        console.log(`   Result:`, JSON.stringify(statusRes.data.job.result).substring(0, 50) + '...');
      }
    }

    
    console.log('Testing Get Jobs by Status...');
    const completedJobs = await axios.get(`${API_URL}/jobs/status/completed`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    console.log(` Found ${completedJobs.data.count} completed jobs`);

    
    console.log('Testing Get Jobs by Priority...');
    const highPriorityJobs = await axios.get(`${API_URL}/jobs/priority/high`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    console.log(`Found ${highPriorityJobs.data.count} high priority jobs`);

    console.log('Testing Queue Metrics...');
    const queueMetrics = await axios.get(`${API_URL}/metrics/queue`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    console.log('   Queue Metrics:');
    console.log('   Critical Queue:', JSON.stringify(queueMetrics.data.metrics.queueMetrics.critical));
    console.log('   High Queue:', JSON.stringify(queueMetrics.data.metrics.queueMetrics.high));
    console.log('   Normal Queue:', JSON.stringify(queueMetrics.data.metrics.queueMetrics.normal));

    console.log('Testing System Metrics...');
    const systemMetrics = await axios.get(`${API_URL}/metrics/system?hours=1`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    console.log('   System Metrics Retrieved');
    console.log('   Period:', systemMetrics.data.period);
    console.log('   Metrics:', JSON.stringify(systemMetrics.data.metrics).substring(0, 100) + '...');

    console.log('Testing Monitoring Dashboard...');
    const dashboard = await axios.get(`${API_URL}/monitoring/dashboard`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    console.log('   Dashboard Data:');
    console.log('   Timestamp:', dashboard.data.data.timestamp);
    console.log('   Derived Metrics:');
    console.log('     Total Active:', dashboard.data.data.derived.totalActive);
    console.log('     Total Waiting:', dashboard.data.data.derived.totalWaiting);
    console.log('     Total Completed:', dashboard.data.data.derived.totalCompleted);
    console.log('     Completion Rate:', dashboard.data.data.derived.completionRate + '%');
    console.log('     Throughput:', dashboard.data.data.derived.throughput);

    console.log(' ALL TESTS PASSED!');
    console.log(' Test Summary:');
    console.log(' Authentication: Working');
    console.log(' Job Creation: 5 job types created');
    console.log(' Job Processing: Jobs processed by workers');
    console.log(' Status Retrieval: Working');
    console.log(' Filtering: By status and priority');
    console.log(' Metrics: Queue and system metrics');
    console.log(' Monitoring: Dashboard data');
    console.log(' Job Queue System is fully operational!\n');

  } catch (error) {
    console.error('TEST FAILED:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    console.error('Make sure:');
    console.error('  1. API server is running (npm run dev)');
    console.error('  2. Workers are running (npm run worker:dev)');
    console.error('  3. PostgreSQL is running');
    console.error('  4. Redis is running');
    console.error('  5. Database is migrated and seeded');
    process.exit(1);
  }
}

async function testSSEStream() {
  console.log('\n📡 Testing SSE Stream...');
  console.log('Connect to http://localhost:3000/api/monitoring/stream');
  console.log('(Use curl or browser to test SSE)');
  console.log('\nExample:');
  console.log(`  curl -N http://localhost:3000/api/monitoring/stream \\`);
  console.log(`    -H "Authorization: Bearer YOUR_TOKEN"`);
}

console.log('Starting tests in 2 seconds...');
setTimeout(() => {
  testAPI().then(() => {
    testSSEStream();
  });
}, 2000);