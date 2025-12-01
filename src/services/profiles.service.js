const mongo = require("../db/mongo");
const config = require('../config');
let pool;
if (!config.MONGODB_URI) {
  pool = require('../db').pool;
}

class ProfilesService {
  async getProfile(userId) {
    if (process.env.MONGODB_URI) {
      await mongo.connect();
      const { profiles } = mongo.getCollections();
      return await profiles.findOne({ _id: userId });
    }

    const result = await pool.query(
      "SELECT id, email, full_name, phone, is_admin, created_at, updated_at FROM profiles WHERE id = $1",
      [userId]
    );
    return result.rows[0];
  }

  async getProfileByEmail(email) {
    if (process.env.MONGODB_URI) {
      await mongo.connect();
      const { profiles } = mongo.getCollections();
      return profiles.findOne({ email });
    }

    const result = await pool.query(
      "SELECT id, email, full_name, phone, is_admin, password_hash, created_at, updated_at FROM profiles WHERE email = $1",
      [email]
    );
    return result.rows[0];
  }

  async createProfile(userId, data = {}) {
    if (process.env.MONGODB_URI) {
      await mongo.connect();
      const { profiles } = mongo.getCollections();
      const doc = {
        _id: userId,
        email: data.email || null,
        full_name: data.full_name || null,
        phone: data.phone || null,
        is_admin: data.is_admin || false,
        // allow setting optional fields when creating via backend
        ...(data.password_hash ? { password_hash: data.password_hash } : {}),
        ...(data.email_confirm_token ? { email_confirm_token: data.email_confirm_token } : {}),
        ...(typeof data.email_confirmed !== 'undefined' ? { email_confirmed: data.email_confirmed } : {}),
        ...(data.password_reset_token ? { password_reset_token: data.password_reset_token } : {}),
        ...(data.password_reset_expires ? { password_reset_expires: data.password_reset_expires } : {}),
        created_at: new Date(),
        updated_at: new Date(),
      };
      try {
        await profiles.insertOne(doc);
        return doc;
      } catch (e) {
        // If insert fails (duplicate) return existing
        return await profiles.findOne({ _id: userId });
      }
    }
    // Postgres path not implemented for create in this helper
    throw new Error('createProfile not implemented for Postgres mode');
  }

  async updateProfile(userId, updates) {
    if (process.env.MONGODB_URI) {
      await mongo.connect();
      const { profiles } = mongo.getCollections();
      // Allow updating a controlled set of fields for Mongo profiles
      const allowed = [
        'full_name',
        'phone',
        'password_hash',
        'email_confirmed',
        'email_confirm_token',
        'password_reset_token',
        'password_reset_expires',
      ];
      const updateDoc = {};
      for (const k of allowed) {
        if (Object.prototype.hasOwnProperty.call(updates, k)) {
          updateDoc[k] = updates[k];
        }
      }
      updateDoc.updated_at = new Date();
      const res = await profiles.findOneAndUpdate(
        { _id: userId },
        { $set: updateDoc },
        { returnDocument: 'after', upsert: false }
      );
      return res.value;
    }

    const result = await pool.query(
      `UPDATE profiles 
       SET full_name = COALESCE($1, full_name),
           phone = COALESCE($2, phone),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING id, email, full_name, phone, is_admin, created_at, updated_at`,
      [updates.full_name, updates.phone, userId]
    );
    return result.rows[0];
  }

  async getAllProfiles() {
    if (process.env.MONGODB_URI) {
      await mongo.connect();
      const { profiles } = mongo.getCollections();
      return profiles.find({}).sort({ created_at: -1 }).toArray();
    }

    const result = await pool.query(
      "SELECT id, email, full_name, phone, is_admin, created_at FROM profiles ORDER BY created_at DESC"
    );
    return result.rows;
  }

  async getProfileByResetToken(token) {
    if (process.env.MONGODB_URI) {
      await mongo.connect();
      const { profiles } = mongo.getCollections();
      return profiles.findOne({ password_reset_token: token });
    }
    // Not supported for Postgres in this helper
    return null;
  }

  async getProfileByConfirmToken(token) {
    if (process.env.MONGODB_URI) {
      await mongo.connect();
      const { profiles } = mongo.getCollections();
      return profiles.findOne({ email_confirm_token: token });
    }
    return null;
  }
}

module.exports = new ProfilesService();
