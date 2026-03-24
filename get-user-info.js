#!/usr/bin/env node

/**
 * Get User Info for Chat Testing
 * 
 * This script helps you find your user ID for testing the chat feature.
 * Run: node get-user-info.js
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

async function getUserInfo() {
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    console.error('❌ MONGODB_URI not found in .env file');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db();
    const profiles = db.collection('profiles');

    // Get all profiles (limited to first 10)
    const allProfiles = await profiles.find({}).limit(10).toArray();
    
    if (allProfiles.length === 0) {
      console.log('\n❌ No profiles found in database');
      return;
    }

    console.log('\n📋 Available Users:\n');
    console.log('Format: Full Name | Email | User ID');
    console.log('-'.repeat(80));
    
    allProfiles.forEach(profile => {
      console.log(`${profile.full_name || 'N/A'} | ${profile.email} | ${profile._id}`);
    });

    console.log('\n📝 To test the chat:');
    console.log('1. Copy one of the User IDs above');
    console.log('2. In your browser console (F12), run:');
    console.log('   localStorage.setItem("dev_token", "dev:YOUR_USER_ID_HERE")');
    console.log('3. Refresh the page');
    console.log('4. Go to the Chat page and try searching for users');
    console.log('\nExample:');
    if (allProfiles[0]) {
      console.log(`   localStorage.setItem("dev_token", "dev:${allProfiles[0]._id}")`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

getUserInfo();
