const fetch = require('node-fetch');

async function testDelete() {
  const baseUrl = 'http://localhost:3001/api';
  
  // First, get all images to find an ID
  console.log('1. Fetching gallery images...');
  const getRes = await fetch(`${baseUrl}/gallery`);
  const getBody = await getRes.json();
  console.log('Response:', getBody);
  
  if (!getBody.data || getBody.data.length === 0) {
    console.log('No images to test with');
    return;
  }
  
  const testImageId = getBody.data[0].id;
  console.log(`\n2. Testing DELETE with image ID: ${testImageId}`);
  console.log(`ID type: ${typeof testImageId}`);
  
  // Get the dev token (you'll need to set this from your frontend localStorage)
  const devToken = 'YOUR_DEV_TOKEN_HERE'; // Replace with actual token
  
  console.log(`\n3. Sending DELETE request to: ${baseUrl}/admin/gallery/${testImageId}`);
  const deleteRes = await fetch(`${baseUrl}/admin/gallery/${testImageId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${devToken}`,
      'Content-Type': 'application/json'
    }
  });
  
  console.log('Status:', deleteRes.status);
  const deleteBody = await deleteRes.json();
  console.log('Response:', deleteBody);
}

testDelete().catch(console.error);
