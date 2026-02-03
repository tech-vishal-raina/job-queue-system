const express = require('express');
const authController = require('../controllers/authController');
const jobController = require('../controllers/jobController');
const monitoringController = require('../controllers/monitoringController');
const authMiddleware = require('../middleware/auth');
const validation = require('../middleware/validation');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Service is healthy',
    timestamp: new Date().toISOString(),
  });
});

router.post('/auth/register', validation.validateLogin, authController.register);
router.post('/auth/login', validation.validateLogin, authController.login);
router.get('/auth/profile', authMiddleware.verifyToken, authController.getProfile);

router.post(
  '/jobs',
  authMiddleware.verifyToken,
  validation.validateCreateJob,
  jobController.createJob
);

router.get(
  '/jobs/status/:status',
  authMiddleware.verifyToken,
  validation.validateStatus,
  jobController.getJobsByStatus
);

router.get(
  '/jobs/priority/:priority',
  authMiddleware.verifyToken,
  validation.validatePriority,
  jobController.getJobsByPriority
);

router.get(
  '/jobs/:jobId',
  authMiddleware.optionalAuth,
  validation.validateJobId,
  jobController.getJobStatus
);

router.get(
  '/metrics/queue',
  authMiddleware.verifyToken,
  jobController.getQueueMetrics
);

router.get(
  '/metrics/system',
  authMiddleware.verifyToken,
  jobController.getSystemMetrics
);

router.get(
  '/monitoring/stream',
  authMiddleware.verifyToken,
  (req, res) => monitoringController.streamMetrics(req, res)
);

router.get(
  '/monitoring/dashboard',
  authMiddleware.verifyToken,
  (req, res) => monitoringController.getDashboard(req, res)
);

module.exports = router;