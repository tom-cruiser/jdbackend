const express = require("express");
const galleryController = require("../controllers/gallery.controller");
const authMiddleware = require("../middleware/auth.middleware");
const adminMiddleware = require("../middleware/admin.middleware");
const { validate, schemas } = require("../middleware/validate.middleware");
const {
  uploadSingleImage,
  handleUploadError,
} = require("../middleware/upload.middleware");

const publicRouter = express.Router();
const adminRouter = express.Router();

// Public routes
publicRouter.get("/", galleryController.getAllImages);
publicRouter.get("/:id", galleryController.getImageById);

// Admin routes (require auth and admin role)
adminRouter.use(authMiddleware, adminMiddleware);
adminRouter.post(
  "/",
  uploadSingleImage("image"),
  handleUploadError,
  validate(schemas.gallery),
  galleryController.uploadImage
);
adminRouter.put(
  "/:id",
  validate(schemas.gallery),
  galleryController.updateImage
);
adminRouter.delete("/:id", galleryController.deleteImage);
adminRouter.get("/auth/parameters", galleryController.getAuthParameters);

module.exports = {
  publicRouter,
  adminRouter,
};
