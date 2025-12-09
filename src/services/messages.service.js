const emailService = require("./email.service");
const mongo = require("../db/mongo");
const config = require('../config');
let pool;
if (!config.MONGODB_URI) {
  pool = require('../db').pool;
}

class MessagesService {
  async createMessage(messageData) {
    if (process.env.MONGODB_URI) {
      await mongo.connect();
      const { messages } = mongo.getCollections();
      const doc = {
        _id: require('crypto').randomUUID(),
        name: messageData.name,
        email: messageData.email,
        message: messageData.message,
        is_read: false,
        created_at: new Date(),
      };
      await messages.insertOne(doc);
      const message = doc;

      // Email sending disabled: log instead of sending.
      try {
        console.info('Email disabled: would notify admin of contact message', message._id || message.id);
        console.info('Email disabled: would send confirmation to', message.email);
      } catch (e) {}

      return message;
    }

    const result = await pool.query(
      `INSERT INTO messages (name, email, message)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [messageData.name, messageData.email, messageData.message]
    );

    const message = result.rows[0];

    // Email sending disabled: log instead of sending.
    try {
      console.info('Email disabled: would notify admin of contact message (SQL)', message.id);
      console.info('Email disabled: would send confirmation to', message.email);
    } catch (e) {}

    return message;
  }

  async getAllMessages() {
    if (process.env.MONGODB_URI) {
      await mongo.connect();
      const { messages } = mongo.getCollections();
      return messages.find({}).sort({ created_at: -1 }).toArray();
    }

    const result = await pool.query(
      "SELECT * FROM messages ORDER BY created_at DESC"
    );
    return result.rows;
  }

  async markAsRead(id) {
    if (process.env.MONGODB_URI) {
      await mongo.connect();
      const { messages } = mongo.getCollections();
      const res = await messages.findOneAndUpdate(
        { _id: id },
        { $set: { is_read: true } },
        { returnDocument: 'after' }
      );
      return res.value;
    }

    const result = await pool.query(
      "UPDATE messages SET is_read = true WHERE id = $1 RETURNING *",
      [id]
    );
    return result.rows[0];
  }

  async deleteMessage(id) {
    if (process.env.MONGODB_URI) {
      await mongo.connect();
      const { messages } = mongo.getCollections();
      const res = await messages.findOneAndDelete({ _id: id });
      return res.value;
    }

    const result = await pool.query(
      "DELETE FROM messages WHERE id = $1 RETURNING *",
      [id]
    );
    return result.rows[0];
  }
}

module.exports = new MessagesService();
