require('dotenv').config({ path: './.env' });
const { MongoClient } = require('mongodb');
(async ()=>{
  try{
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/padodb';
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();
    const db = client.db();
    const profiles = db.collection('profiles');
    const cursor = profiles.find({}, { projection: { email:1, full_name:1, email_confirmed:1, password_hash:1, password_reset_token:1, password_reset_expires:1, role:1, is_admin:1 } }).limit(100);
    const arr = await cursor.toArray();
    console.log(JSON.stringify(arr, null, 2));
    await client.close();
  }catch(e){
    console.error('error', e);
    process.exit(1);
  }
})();
