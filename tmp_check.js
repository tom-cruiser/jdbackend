const { MongoClient } = require('mongodb');
const crypto = require('crypto');
(async ()=>{
  try{
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/padodb';
    const client = new MongoClient(uri,{useNewUrlParser:true,useUnifiedTopology:true});
    await client.connect();
    const db = client.db();
    const profiles = db.collection('profiles');
    const p = await profiles.findOne({ email: 'bujumburapadel@gmail.com' });
    console.log('found:', !!p);
    console.log(p);
    if(p && p.password_hash){
      const parts = p.password_hash.split('$');
      console.log('parts length', parts.length);
      const [scheme,salt,derived] = parts;
      console.log('scheme',scheme);
      const computed = crypto.scryptSync('MyS3cret!', salt, 64).toString('hex');
      console.log('derived matches?', computed === derived);
    }
    await client.close();
  }catch(e){
    console.error('error',e);
    process.exit(1);
  }
})();
