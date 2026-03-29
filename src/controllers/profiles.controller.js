const profilesService = require("../services/profiles.service");
const { formatResponse } = require("../utils/helpers");

function deriveScrypt(password, salt) {
  const crypto = require("crypto");
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

function createScryptHash(password) {
  const crypto = require("crypto");
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = deriveScrypt(password, salt);
  return `scrypt$${salt}$${derived}`;
}

function timingSafeHexEquals(a, b) {
  const crypto = require("crypto");
  const left = Buffer.from(a || "", "hex");
  const right = Buffer.from(b || "", "hex");
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

async function verifyPassword(storedHash, password) {
  if (typeof storedHash !== "string" || !storedHash) return false;

  if (storedHash.startsWith("scrypt$")) {
    const [scheme, salt, derived] = storedHash.split("$");
    if (scheme !== "scrypt" || !salt || !derived) return false;
    const computed = deriveScrypt(password, salt);
    return timingSafeHexEquals(computed, derived);
  }

  if (
    storedHash.startsWith("$2a$") ||
    storedHash.startsWith("$2b$") ||
    storedHash.startsWith("$2y$") ||
    storedHash.startsWith("bcrypt$")
  ) {
    try {
      const bcrypt = require("bcryptjs");
      const normalizedHash = storedHash.startsWith("bcrypt$")
        ? storedHash.substring(7)
        : storedHash;
      return await bcrypt.compare(password, normalizedHash);
    } catch (e) {
      return false;
    }
  }

  return storedHash === password;
}

const profilesController = {
  async getMyProfile(req, res, next) {
    try {
      const profile = await profilesService.getProfile(req.user.id);
      if (profile) {
        // remove sensitive fields
        const safe = { ...profile };
        delete safe.password_hash;
        delete safe.email_confirm_token;
        delete safe.password_reset_token;
        delete safe.password_reset_expires;
        // MongoDB uses _id, but frontend expects id
        if (safe._id && !safe.id) {
          safe.id = safe._id;
        }
        res.json(formatResponse(true, safe));
      } else {
        res.json(formatResponse(true, null));
      }
    } catch (error) {
      next(error);
    }
  },

  async updateMyProfile(req, res, next) {
    try {
      const updatedProfile = await profilesService.updateProfile(
        req.user.id,
        req.body
      );
      res.json(
        formatResponse(true, updatedProfile, "Profile updated successfully")
      );
    } catch (error) {
      next(error);
    }
  },

  async changeMyPassword(req, res, next) {
    try {
      const body = req.body || {};
      const currentPassword =
        typeof body.current_password === "string" ? body.current_password : "";
      const newPassword =
        typeof body.new_password === "string" ? body.new_password : "";
      const confirmPassword =
        typeof body.confirm_password === "string" ? body.confirm_password : "";

      if (!currentPassword || !newPassword) {
        return res
          .status(400)
          .json(
            formatResponse(false, null, "Current password and new password are required")
          );
      }

      if (newPassword.length < 8) {
        return res
          .status(400)
          .json(
            formatResponse(false, null, "New password must be at least 8 characters")
          );
      }

      if (confirmPassword && confirmPassword !== newPassword) {
        return res
          .status(400)
          .json(formatResponse(false, null, "Passwords do not match"));
      }

      const profile = await profilesService.getProfile(req.user.id);
      if (!profile) {
        return res.status(404).json(formatResponse(false, null, "Profile not found"));
      }

      const isValidCurrent = await verifyPassword(
        profile.password_hash,
        currentPassword
      );
      if (!isValidCurrent) {
        return res
          .status(401)
          .json(formatResponse(false, null, "Current password is incorrect"));
      }

      await profilesService.updateProfile(req.user.id, {
        password_hash: createScryptHash(newPassword),
        reset_password_token_hash: null,
        reset_password_expires_at: null,
      });

      return res.json(formatResponse(true, null, "Password updated successfully"));
    } catch (error) {
      next(error);
    }
  },

  async getAllProfiles(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const filters = {
        search: req.query.search, // Search by name, email, phone
        role: req.query.role, // 'admin', 'user'
        email_confirmed: req.query.email_confirmed, // 'true', 'false'
      };
      
      const result = await profilesService.getAllProfiles(filters, page, limit);
      
      // Remove sensitive fields
      const safeProfiles = result.profiles.map((p) => {
        const copy = { ...p };
        delete copy.password_hash;
        delete copy.email_confirm_token;
        delete copy.password_reset_token;
        delete copy.password_reset_expires;
        // Add id field for frontend compatibility
        if (copy._id && !copy.id) {
          copy.id = copy._id;
        }
        return copy;
      });
      
      res.json(formatResponse(true, {
        profiles: safeProfiles,
        pagination: result.pagination
      }));
    } catch (error) {
      next(error);
    }
  },
};

module.exports = profilesController;
