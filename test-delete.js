const mongo = require('./src/db/mongo');

async function testDelete() {
  try {
    await mongo.connect();
    const { gallery_images } = mongo.getCollections();
    
    // Get an image to test deletion
    const images = await gallery_images.find({}).toArray();
    
    if (images.length === 0) {
      console.log('No images to test deletion with');
      process.exit(0);
    }
    
    // Find an image with 'tet' in title (looks like a test image)
    const testImage = images.find(img => img.title && img.title.toLowerCase().includes('tet'));
    
    if (!testImage) {
      console.log('No test image found (looking for "tet" in title)');
      console.log('Available images:', images.map(i => ({ id: i._id, title: i.title })));
      process.exit(0);
    }
    
    const testId = testImage._id;
    console.log('\n=== Testing deletion ===');
    console.log('Image to delete:', {
      id: testId,
      title: testImage.title,
      created_at: testImage.created_at
    });
    
    console.log('\n1. Attempting findOneAndDelete...');
    const result = await gallery_images.findOneAndDelete({ _id: testId });
    
    console.log('\n2. Delete result:');
    console.log('  - result.ok:', result.ok);
    console.log('  - result.value:', result.value ? 'FOUND' : 'NOT FOUND');
    
    if (result.value) {
      console.log('\n✅ DELETE SUCCESSFUL!');
      console.log('Deleted document:', {
        id: result.value._id,
        title: result.value.title
      });
    } else {
      console.log('\n❌ DELETE FAILED - Document not found');
    }
    
    // Verify deletion
    console.log('\n3. Verifying deletion...');
    const stillExists = await gallery_images.findOne({ _id: testId });
    console.log('  - Document still exists:', stillExists ? 'YES (ERROR!)' : 'NO (Success!)');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testDelete();
