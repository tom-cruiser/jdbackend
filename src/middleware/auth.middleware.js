const authService = require("../services/auth.service");
const { formatResponse } = require("../utils/helpers");
const logger = require('../utils/logger');
const profilesService = require('../services/profiles.service');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      logger.debug({ event: 'auth.missing_or_invalid_header', ip: req.ip, path: req.path, headerPresent: !!authHeader });
      return res
        .status(401)
        .json(
          formatResponse(false, null, "Authorization header missing or invalid")
        );
    }

    const token = authHeader.substring(7);
    // mask token for logs
    const masked = token ? (token.length > 12 ? token.substring(0, 8) + '...' : token) : null;
    logger.debug({ event: 'auth.token_received', ip: req.ip, path: req.path, tokenSample: masked });

    // Verify token with Supabase
    const user = await authService.verifyToken(token);

    // Get user profile from database
    let profile = await authService.getUserProfile(user.id);

    // If profile missing in Mongo dev mode, create a minimal profile automatically
    if (!profile && process.env.MONGODB_URI) {
      try {
        const created = await profilesService.createProfile(user.id, { email: user.email });
        profile = created;
        logger.debug({ event: 'auth.profile_auto_created', ip: req.ip, path: req.path, userId: user.id });
      } catch (e) {
        // ignore create errors, will fall through to 404
      }
    }

    if (!profile) {
      return res
        .status(404)
        .json(formatResponse(false, null, "User profile not found"));
    }

    // Attach user and profile to request
    req.user = user;
    req.profile = profile;

    next();
  } catch (error) {
    // Log reason for authentication failure to aid debugging (do not log full tokens)
    try { logger.info({ event: 'auth.failed', ip: req.ip, path: req.path, message: error.message }); } catch (e) {}
    return res
      .status(401)
      .json(
        formatResponse(false, null, "Authentication failed", error.message)
      );
  }
};

module.exports = authMiddleware;
