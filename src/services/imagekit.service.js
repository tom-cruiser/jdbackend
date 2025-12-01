const ImageKit = require("imagekit");
const config = require("../config");
const logger = require("../utils/logger");
const { FILE } = require("../utils/constants");

class ImageKitService {
  constructor() {
    this.imagekit = new ImageKit({
      publicKey: config.IMAGEKIT_PUBLIC_KEY,
      privateKey: config.IMAGEKIT_PRIVATE_KEY,
      urlEndpoint: config.IMAGEKIT_URL_ENDPOINT,
    });
    logger.info("✅ ImageKit service initialized");
  }

  async uploadImage(fileBuffer, fileName, folder = "/court-booking") {
    try {
      const result = await this.imagekit.upload({
        file: fileBuffer,
        fileName,
        folder,
        useUniqueFileName: true,
      });

      logger.info(`✅ Image uploaded: ${result.name}`);
      return {
        success: true,
        data: {
          fileId: result.fileId,
          url: result.url,
          name: result.name,
          size: result.size,
        },
      };
    } catch (error) {
      logger.error("❌ Image upload failed:", error);
      return { success: false, error: error.message };
    }
  }

  async deleteImage(fileId) {
    try {
      await this.imagekit.deleteFile(fileId);
      logger.info(`✅ Image deleted: ${fileId}`);
      return { success: true };
    } catch (error) {
      logger.error("❌ Image deletion failed:", error);
      return { success: false, error: error.message };
    }
  }

  validateFile(file) {
    if (!file) return { valid: false, error: "No file provided" };
    if (!FILE.ALLOWED_TYPES.includes(file.mimetype)) {
      return { valid: false, error: "Invalid file type" };
    }
    if (file.size > FILE.MAX_SIZE) {
      return { valid: false, error: "File too large" };
    }
    return { valid: true };
  }

  getAuthParameters() {
    return this.imagekit.getAuthenticationParameters();
  }
}

module.exports = new ImageKitService();
