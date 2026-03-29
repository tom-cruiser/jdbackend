const { formatResponse } = require("../utils/helpers");
const config = require("../config");
const emailService = require("../services/email.service");
const { buildResetPasswordTemplate } = require("../utils/emailTemplates");

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

function createRandomToken() {
  const crypto = require("crypto");
  return crypto.randomBytes(32).toString("hex");
}

function hashToken(rawToken) {
  const crypto = require("crypto");
  return crypto.createHash("sha256").update(String(rawToken)).digest("hex");
}

function buildClientLink(pathname, token) {
  const base = String(config.CLIENT_URL || "http://localhost:5173").replace(
    /\/+$/,
    ""
  );
  const query = new URLSearchParams({ token }).toString();
  return `${base}${pathname}?${query}`;
}

function timingSafeHexEquals(a, b) {
  const crypto = require("crypto");
  const left = Buffer.from(a || "", "hex");
  const right = Buffer.from(b || "", "hex");
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

async function verifyPassword(profile, password, profilesService) {
  const logger = require("../utils/logger");
  try {
    const stored = profile && profile.password_hash;
    if (typeof stored !== "string" || !stored) {
      logger.debug("verifyPassword: no password_hash found");
      return false;
    }

    // Preferred format: scrypt$<salt>$<derived-hex>
    if (stored.startsWith("scrypt$")) {
      const [scheme, salt, derived] = stored.split("$");
      if (scheme !== "scrypt" || !salt || !derived) {
        logger.debug("verifyPassword: malformed scrypt hash");
        return false;
      }

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
        logger.error("verifyPassword: bcrypt error", { error: e.message });
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
        logger.warn("verifyPassword: failed to migrate plaintext to scrypt", { error: e.message });
        // Continue login even if migration write fails.
      }
      return true;
    }

    return false;
  } catch (e) {
    logger.error("verifyPassword: unexpected error", { error: e.message, stack: e.stack });
    return false;
  }
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
    logger.info("localLogin attempt", { email });

    if (!email || !password) {
      return res
        .status(400)
        .json(formatResponse(false, null, "Email and password required"));
    }

    try {
      const profilesService = require("../services/profiles.service");
      const profile = await profilesService.getProfileByEmail(email.toLowerCase());
      if (!profile) {
        logger.warn("localLogin: profile not found", { email });
        return res
          .status(401)
          .json(formatResponse(false, null, "Invalid email or password"));
      }

      // Check if profile has password_hash before verifying
      if (!profile.password_hash) {
        logger.warn("localLogin: profile missing password_hash", { userId: profile._id });
        return res
          .status(401)
          .json(formatResponse(false, null, "Invalid email or password"));
      }

      const isValidPassword = await verifyPassword(profile, password, profilesService);
      if (!isValidPassword) {
        logger.warn("localLogin: password mismatch", { email });
        return res
          .status(401)
          .json(formatResponse(false, null, "Invalid email or password"));
      }

      // Update last login time
      try {
        await profilesService.updateLastLogin(profile._id || profile.id);
      } catch (updateErr) {
        logger.error("localLogin: failed to update last login", { email, error: updateErr.message });
        // Continue despite update failure - don't block login
      }

      // Success — return dev token for local development
      const token = `dev:${profile._id || profile.id}`;
      // Sanitize profile before returning
      let safeProfile = { ...profile };
      if (safeProfile.password_hash) delete safeProfile.password_hash;
      if (typeof safeProfile.toObject === 'function') {
        safeProfile = safeProfile.toObject();
      }

      logger.info("localLogin: success", { userId: profile._id, email });
      return res.json(formatResponse(true, { token, profile: safeProfile }));
    } catch (e) {
      logger.error("localLogin error", { email, error: e.message, stack: e.stack });
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
      const doc = await profilesService.createProfile(userId, {
        email,
        full_name: full_name || null,
        phone: phone || null,
        is_admin: false,
        password_hash,
        email_confirmed: true,
        email_confirm_token_hash: null,
        email_confirm_expires_at: null,
      });

      const data = {
        email: doc.email,
        message: "Registration successful. You can now sign in.",
      };

      return res.json(
        formatResponse(true, data, "Registration successful. You can now sign in.")
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

  async resendVerification(req, res) {
    return res.json(
      formatResponse(
        true,
        null,
        "Email verification is disabled. You can sign in immediately after registration."
      )
    );
  },

  async confirmEmail(req, res) {
    return res.json(
      formatResponse(
        true,
        null,
        "Email verification is disabled. You can sign in immediately after registration."
      )
    );
  },

  async requestPasswordReset(req, res) {
    const body = req.body || {};
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email) {
      return res.status(400).json(formatResponse(false, null, "Email is required"));
    }

    try {
      const profilesService = require("../services/profiles.service");
      const profile = await profilesService.getProfileByEmail(email);

      if (profile) {
        const rawResetToken = createRandomToken();
        const resetTokenHash = hashToken(rawResetToken);
        const resetExpiry = new Date(Date.now() + 60 * 60 * 1000);

        await profilesService.updateProfile(profile._id || profile.id, {
          reset_password_token_hash: resetTokenHash,
          reset_password_expires_at: resetExpiry,
        });

        const resetUrl = buildClientLink("/reset-password", rawResetToken);
        const payload = buildResetPasswordTemplate({
          resetUrl,
          fullName: profile.full_name,
        });

        try {
          await emailService.sendMail({
            to: profile.email,
            subject: payload.subject,
            text: payload.text,
            html: payload.html,
          });
        } catch (mailError) {
          // Keep the same generic response to avoid account enumeration and
          // avoid surfacing SMTP outages as client-visible 500s.
          console.error("requestPasswordReset email send error", {
            message: mailError && mailError.message,
            code: mailError && mailError.code,
            command: mailError && mailError.command,
            recipient: profile.email,
          });
        }

        if (config.NODE_ENV !== "production") {
          return res.json(
            formatResponse(
              true,
              { reset_link: resetUrl },
              "If an account exists for this email, a reset link has been sent."
            )
          );
        }
      }

      return res.json(
        formatResponse(
          true,
          null,
          "If an account exists for this email, a reset link has been sent."
        )
      );
    } catch (e) {
      console.error("requestPasswordReset error", e);
      return res
        .status(500)
        .json(formatResponse(false, null, "Unable to process password reset request"));
    }
  },

  async resetPassword(req, res) {
    const body = req.body || {};
    const token = typeof body.token === "string" ? body.token.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!token || !password) {
      return res
        .status(400)
        .json(formatResponse(false, null, "Token and password are required"));
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json(formatResponse(false, null, "Password must be at least 8 characters"));
    }

    try {
      const profilesService = require("../services/profiles.service");
      const tokenHash = hashToken(token);
      const profile = await profilesService.getProfileByResetTokenHash(tokenHash);

      if (!profile) {
        return res.status(400).json(formatResponse(false, null, "Invalid token"));
      }

      const expiresAt = profile.reset_password_expires_at
        ? new Date(profile.reset_password_expires_at)
        : null;

      if (!expiresAt || expiresAt.getTime() < Date.now()) {
        return res
          .status(400)
          .json(formatResponse(false, null, "Reset token expired"));
      }

      await profilesService.updateProfile(profile._id || profile.id, {
        password_hash: createScryptHash(password),
        reset_password_token_hash: null,
        reset_password_expires_at: null,
      });

      return res.json(formatResponse(true, null, "Password reset successfully"));
    } catch (e) {
      console.error("resetPassword error", e);
      return res
        .status(500)
        .json(formatResponse(false, null, "Unable to reset password"));
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
