const express = require('express');
const debugController = require('../controllers/debug.controller');

const router = express.Router();

// Public endpoint to trigger a test email. Use ?to=you@example.com to override.
router.get('/send-test-email', debugController.sendTestEmail);

module.exports = router;
