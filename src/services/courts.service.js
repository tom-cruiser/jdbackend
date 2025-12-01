const mongo = require("../db/mongo");
const config = require('../config');
let pool;
if (!config.MONGODB_URI) {
  pool = require('../db').pool;
}

class CourtsService {
  async getAllCourts(activeOnly = true) {
    if (process.env.MONGODB_URI) {
      await mongo.connect();
      const { courts } = mongo.getCollections();
      const filter = activeOnly ? { is_active: true } : {};
      return courts.find(filter).sort({ name: 1 }).toArray();
    }

    const query = activeOnly
      ? "SELECT * FROM courts WHERE is_active = true ORDER BY name"
      : "SELECT * FROM courts ORDER BY name";

    const result = await pool.query(query);
    return result.rows;
  }

  async getCourtById(id) {
    if (process.env.MONGODB_URI) {
      await mongo.connect();
      const { courts } = mongo.getCollections();
      return courts.findOne({ _id: id });
    }

    const result = await pool.query("SELECT * FROM courts WHERE id = $1", [id]);
    return result.rows[0];
  }

  async createCourt(courtData) {
    if (process.env.MONGODB_URI) {
      await mongo.connect();
      const { courts } = mongo.getCollections();
      const doc = {
        _id: courtData.id || require('crypto').randomUUID(),
        name: courtData.name,
        color: courtData.color,
        description: courtData.description,
        is_active: courtData.is_active !== false,
        created_at: new Date(),
      };
      await courts.insertOne(doc);
      return doc;
    }

    const result = await pool.query(
      `INSERT INTO courts (name, color, description, is_active)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        courtData.name,
        courtData.color,
        courtData.description,
        courtData.is_active !== false,
      ]
    );
    return result.rows[0];
  }

  async updateCourt(id, courtData) {
    if (process.env.MONGODB_URI) {
      await mongo.connect();
      const { courts } = mongo.getCollections();
      const updateDoc = {
        ...(courtData.name !== undefined && { name: courtData.name }),
        ...(courtData.color !== undefined && { color: courtData.color }),
        ...(courtData.description !== undefined && { description: courtData.description }),
        ...(courtData.is_active !== undefined && { is_active: courtData.is_active }),
        updated_at: new Date(),
      };
      const res = await courts.findOneAndUpdate(
        { _id: id },
        { $set: updateDoc },
        { returnDocument: 'after' }
      );
      return res.value;
    }

    const result = await pool.query(
      `UPDATE courts 
       SET name = COALESCE($1, name),
           color = COALESCE($2, color),
           description = COALESCE($3, description),
           is_active = COALESCE($4, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [
        courtData.name,
        courtData.color,
        courtData.description,
        courtData.is_active,
        id,
      ]
    );
    return result.rows[0];
  }

  async deleteCourt(id) {
    if (process.env.MONGODB_URI) {
      await mongo.connect();
      const { courts } = mongo.getCollections();
      return courts.findOneAndDelete({ _id: id }).then(r => r.value);
    }

    const result = await pool.query(
      "DELETE FROM courts WHERE id = $1 RETURNING *",
      [id]
    );
    return result.rows[0];
  }
}

module.exports = new CourtsService();
