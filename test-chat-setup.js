/**
 * Quick test to verify chat backend setup
 */

const mongo = require('./src/db/mongo');

async function testSetup() {
  try {
    console.log('🧪 Testing Chat Backend Setup...\n');

    // Test MongoDB connection
    console.log('1. Testing MongoDB connection...');
    await mongo.connect();
    console.log('✅ MongoDB connected\n');

    // Test collections
    console.log('2. Testing collections...');
    const collections = mongo.getCollections();
    console.log('✅ Collections available:', Object.keys(collections).join(', '), '\n');

    // Test chat service
    console.log('3. Testing chat service import...');
    const chatService = require('./src/services/chat.service');
    console.log('✅ Chat service imported successfully\n');

    // Test socket handler
    console.log('4. Testing socket handler import...');
    const initializeSocketHandlers = require('./src/socket');
    console.log('✅ Socket handlers imported successfully\n');

    console.log('✅ All tests passed! Chat backend is ready.\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testSetup();
