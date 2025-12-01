const { MongoClient } = require('mongodb');
const config = require('../config');
const logger = require('../utils/logger');

let client;
let db;

async function connect() {
  if (db) return db;
  if (!config.MONGODB_URI) {
    throw new Error('MONGODB_URI is not set in environment');
  }
  client = new MongoClient(config.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  await client.connect();
  db = client.db();
  logger.info('✅ MongoDB connected');
  return db;
}

function getCollections() {
  if (!db) throw new Error('MongoDB not connected; call connect() first');
  return {
    profiles: db.collection('profiles'),
    courts: db.collection('courts'),
    bookings: db.collection('bookings'),
    messages: db.collection('messages'),
    gallery_images: db.collection('gallery_images'),
  };
}

module.exports = {
  connect,
  getCollections,
};
