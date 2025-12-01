const express = require("express");
const profilesController = require("../controllers/profiles.controller");
const authMiddleware = require("../middleware/auth.middleware");
const adminMiddleware = require("../middleware/admin.middleware");
const { validate, schemas } = require("../middleware/validate.middleware");

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// User routes
router.get("/me", profilesController.getMyProfile);
router.put(
  "/me",
  validate(schemas.profile),
  profilesController.updateMyProfile
);

// Admin routes
router.get("/", adminMiddleware, profilesController.getAllProfiles);

module.exports = router;
