const mongo = require('../src/db/mongo');
const config = require('../src/config');

(async () => {
  try {
    if (!config.MONGODB_URI) {
      throw new Error('MONGODB_URI not set in config');
    }
    const db = await mongo.connect();
    const { profiles } = mongo.getCollections();

    const id = process.argv[2] || 'dev-user-1';
    const doc = {
      _id: id,
      email: 'dev+user@example.com',
      full_name: 'Dev User',
      phone: '000-000-0000',
      is_admin: true,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const existing = await profiles.findOne({ _id: id });
    if (existing) {
      console.log('Profile already exists:', existing);
      process.exit(0);
    }

    const res = await profiles.insertOne(doc);
    console.log('Inserted profile with id', id);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
