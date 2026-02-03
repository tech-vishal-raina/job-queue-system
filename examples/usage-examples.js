const axios = require('axios');

const API_URL = 'http://localhost:3000/api';
let authToken = '';

// Helper function for API calls
async function apiCall(method, endpoint, data = null, requiresAuth = true) {
  const config = {
    method,
    url: `${API_URL}${endpoint}`,
    headers: requiresAuth ? { Authorization: `Bearer ${authToken}` } : {},
  };

  if (data) {
    config.data = data;
    config.headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`Error: ${error.response?.data?.message || error.message}`);
    throw error;
  }
}

// ============================================
// Authentication Examples
// ============================================

async function exampleRegister() {
  console.log('\n📝 Example: Register New User');
  console.log('='.repeat(50));

  const userData = {
    username: 'testuser',
    password: 'password123',
  };

  const result = await apiCall('POST', '/auth/register', userData, false);
  console.log('✅ User registered:', result);
}

async function exampleLogin() {
  console.log('\n🔐 Example: User Login');
  console.log('='.repeat(50));

  const credentials = {
    username: 'admin',
    password: 'password123',
  };

  const result = await apiCall('POST', '/auth/login', credentials, false);
  authToken = result.token;
  console.log('✅ Login successful');
  console.log('Token:', authToken.substring(0, 20) + '...');
  console.log('User:', result.user);
}

// ============================================
// Job Creation Examples
// ============================================

async function exampleCreateEmailJob() {
  console.log('\n📧 Example: Create Email Processing Job');
  console.log('='.repeat(50));

  const jobData = {
    name: 'Weekly Newsletter',
    priority: 'high',
    jobType: 'email-processing',
    data: {
      recipients: ['user1@example.com', 'user2@example.com', 'user3@example.com'],
      subject: 'Weekly Update - January 2026',
      template: 'newsletter',
    },
  };

  const result = await apiCall('POST', '/jobs', jobData);
  console.log('✅ Email job created:', result.job);
  return result.job.jobId;
}

async function exampleCreateDataProcessingJob() {
  console.log('\n💾 Example: Create Data Processing Job');
  console.log('='.repeat(50));

  const jobData = {
    name: 'Process Customer Records',
    priority: 'critical',
    jobType: 'data-processing',
    data: {
      recordCount: 5000,
      source: 'customer_export_2026_01',
      operations: ['validate', 'transform', 'deduplicate'],
    },
  };

  const result = await apiCall('POST', '/jobs', jobData);
  console.log('✅ Data processing job created:', result.job);
  return result.job.jobId;
}

async function exampleCreateReportJob() {
  console.log('\n📊 Example: Create Report Generation Job');
  console.log('='.repeat(50));

  const jobData = {
    name: 'Q1 Financial Report',
    priority: 'critical',
    jobType: 'report-generation',
    data: {
      reportType: 'financial_summary',
      period: 'Q1 2026',
      includeCharts: true,
      format: 'PDF',
    },
  };

  const result = await apiCall('POST', '/jobs', jobData);
  console.log('✅ Report generation job created:', result.job);
  return result.job.jobId;
}

async function exampleCreateImageJob() {
  console.log('\n🖼️  Example: Create Image Processing Job');
  console.log('='.repeat(50));

  const jobData = {
    name: 'Batch Image Resize',
    priority: 'normal',
    jobType: 'image-processing',
    data: {
      imageCount: 50,
      operations: ['resize', 'compress', 'watermark'],
      format: 'jpeg',
      quality: 85,
    },
  };

  const result = await apiCall('POST', '/jobs', jobData);
  console.log('✅ Image processing job created:', result.job);
  return result.job.jobId;
}

async function exampleCreateNotificationJob() {
  console.log('\n🔔 Example: Create Notification Job');
  console.log('='.repeat(50));

  const jobData = {
    name: 'Send App Notifications',
    priority: 'high',
    jobType: 'notification',
    data: {
      userCount: 1000,
      channel: 'push',
      message: 'New features available!',
      deepLink: '/features',
    },
  };

  const result = await apiCall('POST', '/jobs', jobData);
  console.log('✅ Notification job created:', result.job);
  return result.job.jobId;
}

// ============================================
// Job Monitoring Examples
// ============================================

async function exampleCheckJobStatus(jobId) {
  console.log(`\n🔍 Example: Check Job Status (${jobId})`);
  console.log('='.repeat(50));

  const result = await apiCall('GET', `/jobs/${jobId}`);
  console.log('Job details:', result.job);
  return result.job;
}

async function exampleGetJobsByStatus(status) {
  console.log(`\n📋 Example: Get Jobs by Status (${status})`);
  console.log('='.repeat(50));

  const result = await apiCall('GET', `/jobs/status/${status}`);
  console.log(`Found ${result.count} ${status} jobs`);
  result.jobs.slice(0, 3).forEach(job => {
    console.log(`  - ${job.name} (${job.priority}) - ${job.jobId}`);
  });
}

async function exampleGetJobsByPriority(priority) {
  console.log(`\n⚡ Example: Get Jobs by Priority (${priority})`);
  console.log('='.repeat(50));

  const result = await apiCall('GET', `/jobs/priority/${priority}`);
  console.log(`Found ${result.count} ${priority} priority jobs`);
  result.jobs.slice(0, 3).forEach(job => {
    console.log(`  - ${job.name} (${job.status}) - ${job.jobId}`);
  });
}

// ============================================
// Metrics Examples
// ============================================

async function exampleGetQueueMetrics() {
  console.log('\n📊 Example: Get Queue Metrics');
  console.log('='.repeat(50));

  const result = await apiCall('GET', '/metrics/queue');
  console.log('Queue Metrics:');
  Object.entries(result.metrics.queueMetrics).forEach(([priority, metrics]) => {
    console.log(`\n${priority.toUpperCase()}:`);
    console.log(`  Waiting: ${metrics.waiting}`);
    console.log(`  Active: ${metrics.active}`);
    console.log(`  Completed: ${metrics.completed}`);
    console.log(`  Failed: ${metrics.failed}`);
  });
}

async function exampleGetSystemMetrics() {
  console.log('\n📈 Example: Get System Metrics');
  console.log('='.repeat(50));

  const result = await apiCall('GET', '/metrics/system?hours=1');
  console.log('System Metrics (Last Hour):');
  
  if (result.metrics.throughput.overall) {
    console.log('\nThroughput:');
    console.log(`  Average: ${result.metrics.throughput.overall.avg} jobs/sec`);
    console.log(`  Max: ${result.metrics.throughput.overall.max} jobs/sec`);
  }
  
  if (result.metrics.failureRate.overall) {
    console.log('\nFailure Rate:');
    console.log(`  Average: ${result.metrics.failureRate.overall.avg}%`);
  }
  
  if (result.metrics.latency.overall) {
    console.log('\nLatency:');
    console.log(`  p95: ${result.metrics.latency.overall.p95}ms`);
  }
}

async function exampleGetDashboard() {
  console.log('\n🎛️  Example: Get Dashboard Data');
  console.log('='.repeat(50));

  const result = await apiCall('GET', '/monitoring/dashboard');
  console.log('Dashboard Summary:');
  console.log(`  Total Active: ${result.data.derived.totalActive}`);
  console.log(`  Total Waiting: ${result.data.derived.totalWaiting}`);
  console.log(`  Total Completed: ${result.data.derived.totalCompleted}`);
  console.log(`  Total Failed: ${result.data.derived.totalFailed}`);
  console.log(`  Completion Rate: ${result.data.derived.completionRate}%`);
  console.log(`  Throughput: ${result.data.derived.throughput} jobs`);
}

// ============================================
// Load Testing Example
// ============================================

async function exampleLoadTest(count = 100) {
  console.log(`\n⚡ Example: Load Test (Creating ${count} jobs)`);
  console.log('='.repeat(50));

  const priorities = ['critical', 'high', 'normal'];
  const jobTypes = ['email-processing', 'data-processing', 'notification'];
  
  const startTime = Date.now();
  const promises = [];

  for (let i = 0; i < count; i++) {
    const jobData = {
      name: `Load Test Job ${i}`,
      priority: priorities[i % 3],
      jobType: jobTypes[i % 3],
      data: {
        testNumber: i,
        timestamp: new Date().toISOString(),
      },
    };

    promises.push(apiCall('POST', '/jobs', jobData));
  }

  await Promise.all(promises);
  const duration = Date.now() - startTime;

  console.log(`✅ Created ${count} jobs in ${duration}ms`);
  console.log(`   Rate: ${(count / (duration / 1000)).toFixed(2)} jobs/sec`);
}

// ============================================
// Main Execution
// ============================================

async function runAllExamples() {
  try {
    console.log('\n🚀 Starting Job Queue System Examples');
    console.log('='.repeat(50));

    // Authentication
    await exampleLogin();
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Create various jobs
    const emailJobId = await exampleCreateEmailJob();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const dataJobId = await exampleCreateDataProcessingJob();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await exampleCreateReportJob();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await exampleCreateImageJob();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await exampleCreateNotificationJob();
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Monitor jobs
    await exampleCheckJobStatus(emailJobId);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await exampleGetJobsByStatus('completed');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await exampleGetJobsByPriority('critical');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Get metrics
    await exampleGetQueueMetrics();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await exampleGetSystemMetrics();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await exampleGetDashboard();

    // Optional: Load test
    // await exampleLoadTest(100);

    console.log('\n✅ All examples completed successfully!');
    console.log('\n💡 Tips:');
    console.log('   - Check logs/ directory for detailed logs');
    console.log('   - Monitor real-time with: GET /api/monitoring/stream');
    console.log('   - Scale workers for higher throughput');

  } catch (error) {
    console.error('\n❌ Error running examples:', error.message);
  }
}

// Run if executed directly
if (require.main === module) {
  runAllExamples();
}

module.exports = {
  exampleLogin,
  exampleCreateEmailJob,
  exampleCheckJobStatus,
  exampleGetQueueMetrics,
  exampleLoadTest,
};