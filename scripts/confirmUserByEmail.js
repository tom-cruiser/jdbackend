require('dotenv').config({ path: './.env' });
const { MongoClient } = require('mongodb');
(async ()=>{
  try{
    const email = process.argv[2];
    if(!email){
      console.error('Usage: node confirmUserByEmail.js user@example.com');
      process.exit(2);
    }
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/padodb';
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();
    const db = client.db();
    const profiles = db.collection('profiles');
    const before = await profiles.findOne({ email: email });
    console.log('Before:', before);
    const res = await profiles.findOneAndUpdate(
      { email: email },
      { $set: { email_confirmed: true, email_confirm_token: null, updated_at: new Date() } },
      { returnDocument: 'after' }
    );
    console.log('After:', res.value);
    await client.close();
  }catch(e){
    console.error('error', e);
    process.exit(1);
  }
})();
