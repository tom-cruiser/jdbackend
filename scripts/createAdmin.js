const crypto = require('crypto');
const profilesService = require('../src/services/profiles.service');
const mongo = require('../src/db/mongo');
const config = require('../src/config');

(async () => {
  try {
    if (!config.MONGODB_URI) {
      console.error('MONGODB_URI not set; this script only supports MongoDB mode');
      process.exit(1);
    }

    await mongo.connect();

    const userId = crypto.randomUUID();
    const email = process.env.ADMIN_EMAIL || 'admin@local.dev';
    const fullName = process.env.ADMIN_NAME || 'Local Admin';

    const profile = await profilesService.createProfile(userId, {
      email,
      full_name: fullName,
      is_admin: true,
    });

    const devToken = `dev:${userId}`;

    console.log('\n✅ Admin profile created (or already existed):');
    console.log('  user_id:', profile._id || profile.id || userId);
    console.log('  email:  ', profile.email || email);
    console.log('  name:   ', profile.full_name || fullName);
    console.log('\nUse this dev token as the Authorization header (development only):');
    console.log(`  Authorization: Bearer ${devToken}`);
    console.log('\nNote: this is a development helper. Do NOT use this token in production.');
    process.exit(0);
  } catch (e) {
    console.error('Failed to create admin profile:', e);
    process.exit(2);
  }
})();
