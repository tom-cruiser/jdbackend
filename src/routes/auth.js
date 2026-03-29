const express = require("express");
const authController = require("../controllers/auth.controller");

const router = express.Router();

// Public health check
router.get("/health", authController.healthCheck);

// Local development password login
router.post("/local-login", authController.localLogin);

// Register a new local user (Mongo-only)
router.post("/register", authController.register);

// Confirm account email by token.
router.post("/confirm-email", authController.confirmEmail);
router.post("/resend-verification", authController.resendVerification);

// Forgot password and reset flows.
router.post("/request-password-reset", authController.requestPasswordReset);
router.post("/reset-password", authController.resetPassword);

// Mode/info endpoint
router.get("/mode", authController.mode);

module.exports = router;
