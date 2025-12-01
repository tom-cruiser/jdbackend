const { MongoClient } = require('mongodb');
const crypto = require('crypto');

function scryptHash(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

function generatePassword() {
  // 12-character URL-safe random password
  return crypto.randomBytes(9).toString('base64url').slice(0, 12);
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Please set MONGODB_URI in the environment and re-run this script.');
    process.exit(1);
  }

  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  try {
    await client.connect();
    const db = client.db();
    const profiles = db.collection('profiles');

    const userId = process.env.ADMIN_USER_ID || crypto.randomUUID();
    const email = process.env.ADMIN_EMAIL || 'admin@local.dev';
    const fullName = process.env.ADMIN_NAME || 'Local Admin';

    const password = process.env.ADMIN_PASSWORD || generatePassword();
    const password_hash = scryptHash(password);

    const doc = {
      _id: userId,
      email,
      full_name: fullName,
      phone: process.env.ADMIN_PHONE || null,
      is_admin: true,
      password_hash,
      created_at: new Date(),
      updated_at: new Date(),
    };

    await profiles.updateOne({ _id: userId }, { $set: doc }, { upsert: true });

    const devToken = `dev:${userId}`;

    console.log('\n✅ Admin profile ensured in MongoDB profiles collection');
    console.log('  user_id:', userId);
    console.log('  email:  ', email);
    console.log('  name:   ', fullName);
    console.log('\nCredentials (development only):');
    console.log('  Password:', password);
    console.log(`  Dev token: Bearer ${devToken}`);

    console.log('\nQuick usage:');
    console.log("  localStorage.setItem('dev_token', '" + devToken + "')");
    console.log("  localStorage.setItem('force_dev_auth','true')");
    console.log('\nOr log in by password if you add a local login endpoint.');

    process.exit(0);
  } catch (e) {
    console.error('Failed to set admin password in MongoDB:', e);
    process.exit(2);
  } finally {
    try { await client.close(); } catch (e) {}
  }
}

main();
