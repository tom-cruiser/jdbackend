const express = require("express");
const courtsController = require("../controllers/courts.controller");
const authMiddleware = require("../middleware/auth.middleware");
const adminMiddleware = require("../middleware/admin.middleware");
const { validate, schemas } = require("../middleware/validate.middleware");

const publicRouter = express.Router();
const adminRouter = express.Router();

// Public routes
publicRouter.get("/", courtsController.getAllCourts);
publicRouter.get("/:id", courtsController.getCourtById);

// Admin routes (require auth and admin role)
adminRouter.use(authMiddleware, adminMiddleware);
adminRouter.post("/", validate(schemas.court), courtsController.createCourt);
adminRouter.put("/:id", validate(schemas.court), courtsController.updateCourt);
adminRouter.delete("/:id", courtsController.deleteCourt);

module.exports = {
  publicRouter,
  adminRouter,
};
