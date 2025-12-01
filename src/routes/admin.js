const express = require("express");
const courtsController = require("../controllers/courts.controller");
const messagesController = require("../controllers/messages.controller");
const profilesController = require("../controllers/profiles.controller");
const galleryController = require("../controllers/gallery.controller");
const authMiddleware = require("../middleware/auth.middleware");
const adminMiddleware = require("../middleware/admin.middleware");

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authMiddleware, adminMiddleware);

// Courts management
router.use("/courts", require("./courts").adminRouter);

// Messages management
router.use("/messages", require("./messages").adminRouter);

// Gallery management
router.use("/gallery", require("./gallery").adminRouter);

// Profiles management
router.get("/profiles", profilesController.getAllProfiles);

// Bookings management (admin)
const bookingsController = require("../controllers/bookings.controller");
router.get('/bookings', bookingsController.getAllBookings);

module.exports = router;
