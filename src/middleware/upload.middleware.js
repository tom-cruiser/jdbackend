const multer = require("multer");
const imagekitService = require("../services/imagekit.service");

// Configure multer for memory storage
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const validation = imagekitService.validateFile(file);
  if (validation.valid) {
    cb(null, true);
  } else {
    cb(new Error(validation.error), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// Middleware for single image upload
const uploadSingleImage = (fieldName = "image") => {
  return upload.single(fieldName);
};

// Middleware for multiple image upload
const uploadMultipleImages = (fieldName = "images", maxCount = 10) => {
  return upload.array(fieldName, maxCount);
};

// Error handling wrapper
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        error: "File too large. Maximum size is 5MB.",
      });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        error: "Too many files. Maximum is 10.",
      });
    }
  }
  if (err) {
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }
  next();
};

module.exports = {
  uploadSingleImage,
  uploadMultipleImages,
  handleUploadError,
};
