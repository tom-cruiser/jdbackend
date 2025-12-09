#!/usr/bin/env node
require('dotenv').config({ path: './.env' });
const { MongoClient } = require('mongodb');

(async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/padodb';
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();
    const db = client.db();
    const coaches = db.collection('coaches');

    const seeds = [
      { _id: 'coach-1', name: 'Alice Fernandez', created_at: new Date() },
      { _id: 'coach-2', name: 'Breno Silva', created_at: new Date() },
      { _id: 'coach-3', name: 'Carlos Nunez', created_at: new Date() },
    ];

    for (const s of seeds) {
      const existing = await coaches.findOne({ _id: s._id });
      if (existing) {
        console.log('Skipping existing coach', s._id);
        continue;
      }
      await coaches.insertOne(s);
      console.log('Inserted coach', s._id, s.name);
    }

    const all = await coaches.find({}).toArray();
    console.log(`Coaches in DB: ${all.length}`);
    all.forEach(c => console.log('-', c._id, c.name));

    await client.close();
    process.exit(0);
  } catch (e) {
    console.error('Seeding failed', e);
    process.exit(1);
  }
})();
