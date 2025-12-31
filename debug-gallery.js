const mongo = require('./src/db/mongo');

async function debugGallery() {
  try {
    await mongo.connect();
    const { gallery_images } = mongo.getCollections();
    
    console.log('\n=== Fetching all gallery images ===');
    const images = await gallery_images.find({}).toArray();
    
    console.log(`\nFound ${images.length} images:\n`);
    images.forEach((img, idx) => {
      console.log(`Image ${idx + 1}:`);
      console.log('  _id:', img._id);
      console.log('  _id type:', typeof img._id);
      console.log('  title:', img.title);
      console.log('  created_at:', img.created_at);
      console.log('---');
    });
    
    if (images.length > 0) {
      const testId = images[0]._id;
      console.log(`\n=== Testing deletion with first image ID: ${testId} ===`);
      console.log('Attempting findOne with _id:', testId);
      
      const found = await gallery_images.findOne({ _id: testId });
      console.log('Found document:', found ? 'YES' : 'NO');
      
      if (found) {
        console.log('\nDocument found! ID comparison should work.');
      } else {
        console.log('\nDocument NOT found! There might be an ID type mismatch.');
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debugGallery();
