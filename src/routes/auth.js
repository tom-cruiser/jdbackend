const express = require("express");
const authController = require("../controllers/auth.controller");

const router = express.Router();

// Public health check
router.get("/health", authController.healthCheck);

// Local development password login
router.post('/local-login', authController.localLogin);
// Register a new local user (Mongo-only)
router.post('/register', authController.register);
// Email confirmation
router.get('/confirm-email', authController.confirmEmail);
router.post('/confirm-email', authController.confirmEmail);
// Password reset
router.post('/request-password-reset', authController.requestPasswordReset);
router.post('/reset-password', authController.resetPassword);
// Mode/info endpoint
router.get('/mode', authController.mode);

module.exports = router;
