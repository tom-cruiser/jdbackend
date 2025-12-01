const express = require("express");
const messagesController = require("../controllers/messages.controller");
const authMiddleware = require("../middleware/auth.middleware");
const adminMiddleware = require("../middleware/admin.middleware");
const { validate, schemas } = require("../middleware/validate.middleware");

const publicRouter = express.Router();
const adminRouter = express.Router();

// Public routes
publicRouter.post(
  "/",
  validate(schemas.message),
  messagesController.createMessage
);

// Admin routes (require auth and admin role)
adminRouter.use(authMiddleware, adminMiddleware);
adminRouter.get("/", messagesController.getAllMessages);
adminRouter.patch("/:id/read", messagesController.markAsRead);
adminRouter.delete("/:id", messagesController.deleteMessage);

module.exports = {
  publicRouter,
  adminRouter,
};
