const { MongoClient } = require("mongodb");
const crypto = require("crypto");

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("Please set MONGODB_URI in the environment.");
    process.exit(1);
  }

  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  try {
    await client.connect();
    const db = client.db();
    const profiles = db.collection("profiles");

    const userId = process.env.ADMIN_USER_ID || crypto.randomUUID();
    const email = process.env.ADMIN_EMAIL || "admin@local.dev";
    const fullName = process.env.ADMIN_NAME || "Local Admin";

    const doc = {
      _id: userId,
      email,
      full_name: fullName,
      phone: process.env.ADMIN_PHONE || null,
      is_admin: true,
      created_at: new Date(),
      updated_at: new Date(),
    };

    await profiles.updateOne({ _id: userId }, { $set: doc }, { upsert: true });

    const devToken = `dev:${userId}`;

    console.log("\n✅ Admin upserted to MongoDB profiles collection");
    console.log("  user_id:", userId);
    console.log("  email:  ", email);
    console.log("  name:   ", fullName);
    console.log("\nUse this dev token for local dev (Authorization header):");
    console.log(`  Authorization: Bearer ${devToken}`);
    console.log("\nTo use in the browser:");
    console.log("  localStorage.setItem('dev_token', '" + devToken + "')");
    console.log("  localStorage.setItem('force_dev_auth','true')");
    console.log("\nNote: do NOT use this token in production.");
    process.exit(0);
  } catch (e) {
    console.error("Failed to create admin in MongoDB:", e);
    process.exit(2);
  } finally {
    try {
      await client.close();
    } catch (e) {}
  }
}

main();
