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

async function verifyPassword(profile, password, profilesService) {
  const stored = profile && profile.password_hash;
  if (typeof stored !== "string" || !stored) return false;

  // Preferred format: scrypt$<salt>$<derived-hex>
  if (stored.startsWith("scrypt$")) {
    const [scheme, salt, derived] = stored.split("$");
    if (scheme !== "scrypt" || !salt || !derived) return false;

    const computed = deriveScrypt(password, salt);
    return timingSafeHexEquals(computed, derived);
  }

  // Backward compatibility: bcrypt hashes stored as "$2..." or "bcrypt$..."
  if (
    stored.startsWith("$2a$") ||
    stored.startsWith("$2b$") ||
    stored.startsWith("$2y$") ||
    stored.startsWith("bcrypt$")
  ) {
    try {
      const bcrypt = require("bcryptjs");
      const normalizedHash = stored.startsWith("bcrypt$")
        ? stored.substring(7)
        : stored;
      return await bcrypt.compare(password, normalizedHash);
    } catch (e) {
      return false;
    }
  }

  // Legacy plaintext fallback: allow one-time migration to scrypt.
  if (stored === password) {
    try {
      await profilesService.updateProfile(profile._id || profile.id, {
        password_hash: createScryptHash(password),
      });
    } catch (e) {
      // Continue login even if migration write fails.
    }
    return true;
  }

  return false;
}

const authController = {
  async healthCheck(req, res) {
    res.json(
      formatResponse(true, {
        status: "OK",
        timestamp: new Date().toISOString(),
      })
    );
  },

  async localLogin(req, res) {
    const body = req.body || {};
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const logger = require("../utils/logger");
    logger.info("localLogin attempt", { body: req.body });

    if (!email || !password) {
      return res
        .status(400)
        .json(formatResponse(false, null, "Email and password required"));
    }

    try {
      const profilesService = require("../services/profiles.service");
      const profile = await profilesService.getProfileByEmail(email.toLowerCase());
      if (!profile) {
        return res
          .status(401)
          .json(formatResponse(false, null, "Invalid email or password"));
      }

      const isValidPassword = await verifyPassword(profile, password, profilesService);
      if (!isValidPassword) {
        return res
          .status(401)
          .json(formatResponse(false, null, "Invalid email or password"));
      }

      // Update last login time
      await profilesService.updateLastLogin(profile._id || profile.id);

      // Success — return dev token for local development
      const token = `dev:${profile._id || profile.id}`;
      // Sanitize profile before returning
      const safeProfile = { ...profile };
      if (safeProfile.password_hash) delete safeProfile.password_hash;

      return res.json(formatResponse(true, { token, profile: safeProfile }));
    } catch (e) {
      console.error("localLogin error", e);
      return res.status(500).json(formatResponse(false, null, "Login failed"));
    }
  },

  async register(req, res) {
    const { email, password, full_name, phone } = req.body || {};
    if (!email || !password) {
      return res
        .status(400)
        .json(formatResponse(false, null, "Email and password required"));
    }

    try {
      const profilesService = require("../services/profiles.service");

      // Check if email already exists
      const existingProfile = await profilesService.getProfileByEmail(email);
      if (existingProfile) {
        return res
          .status(409)
          .json(formatResponse(false, null, "Email already registered"));
      }

      const crypto = require("crypto");

      // Simple scrypt hash format used by admin script
      const salt = crypto.randomBytes(16).toString("hex");
      const derived = crypto.scryptSync(password, salt, 64).toString("hex");
      const password_hash = `scrypt$${salt}$${derived}`;

      const userId = crypto.randomUUID();

      // Create profile and auto-confirm email so users can sign in immediately
      const doc = await profilesService.createProfile(userId, {
        email,
        full_name: full_name || null,
        phone: phone || null,
        is_admin: false,
        password_hash,
      });

      // Sanitize and return an auth token so frontend can sign the user in immediately
      const safeProfile = { ...doc };
      if (safeProfile.password_hash) delete safeProfile.password_hash;

      const token = `dev:${userId}`;
      return res.json(
        formatResponse(true, {
          token,
          profile: safeProfile,
          message: "Registration successful.",
        })
      );
    } catch (e) {
      console.error("register error", e);
      return res
        .status(500)
        .json(
          formatResponse(
            false,
            null,
            "Registration failed: " + (e && e.message ? e.message : "")
          )
        );
    }
  },

  async mode(req, res) {
    try {
      const config = require("../config");
      const usingMongo = Boolean(config.MONGODB_URI);
      return res.json({
        success: true,
        data: { db: usingMongo ? "mongo" : "postgres", allowLocalLogin: true },
      });
    } catch (e) {
      console.error("mode endpoint error", e);
      return res
        .status(500)
        .json({ success: false, message: "Unable to determine mode" });
    }
  },
};

module.exports = authController;
