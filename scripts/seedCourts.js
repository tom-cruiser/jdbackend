const mongo = require('../src/db/mongo');

async function seed() {
  await mongo.connect();
  const { courts } = mongo.getCollections();

  const now = new Date();

  const blue = {
    _id: require('crypto').randomUUID(),
    name: 'Blue',
    color: '#2563EB',
    description: 'Blue court — indoor professional surface',
    is_active: true,
    created_at: now,
    updated_at: now,
  };

  const green = {
    _id: require('crypto').randomUUID(),
    name: 'Green',
    color: '#10B981',
    description: 'Green court — outdoor surface',
    is_active: true,
    created_at: now,
    updated_at: now,
  };

  try {
    // Insert but avoid duplicates by name
    const existingBlue = await courts.findOne({ name: blue.name });
    const existingGreen = await courts.findOne({ name: green.name });

    if (!existingBlue) {
      await courts.insertOne(blue);
      console.log('Inserted court Blue');
    } else {
      console.log('Blue court already exists');
    }

    if (!existingGreen) {
      await courts.insertOne(green);
      console.log('Inserted court Green');
    } else {
      console.log('Green court already exists');
    }

    console.log('Seeding courts complete. Note: booking duration is handled client-side (1h30).');
  } catch (err) {
    console.error('Seeding failed', err);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

seed();
