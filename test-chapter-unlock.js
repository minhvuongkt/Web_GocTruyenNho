/**
 * Test script to verify chapter unlocking flow
 * 
 * This script simulates:
 * 1. Authenticating as a user
 * 2. Checking their balance
 * 3. Attempting to unlock a chapter
 * 4. Verifying the unlock status and balance change
 */

const fetch = require('node-fetch');

// Configuration
const BASE_URL = 'http://localhost:5000';
const USER = { username: 'admin', password: 'admin123' };
const CHAPTER_ID = 2; // Adjust to a valid chapter ID that is locked

async function getCookieJar(response) {
  const setCookieHeader = response.headers.get('set-cookie');
  return setCookieHeader;
}

// Main test function
async function testChapterUnlock() {
  console.log('⏳ Starting chapter unlock test flow...');
  
  // Step 1: Login
  console.log('\n🔑 Logging in...');
  const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(USER)
  });
  
  if (!loginResponse.ok) {
    const error = await loginResponse.json();
    console.error('❌ Login failed:', error);
    return;
  }
  
  const cookies = getCookieJar(loginResponse);
  console.log('✅ Logged in successfully');
  
  // Step 2: Get user data (including balance)
  console.log('\n👤 Getting user data...');
  const userResponse = await fetch(`${BASE_URL}/api/user`, {
    headers: { 
      'Cookie': cookies 
    }
  });
  
  if (!userResponse.ok) {
    console.error('❌ Failed to get user data');
    return;
  }
  
  const userData = await userResponse.json();
  console.log(`✅ User retrieved: ${userData.username}`);
  console.log(`💰 Initial balance: ${userData.balance} xu`);
  
  // Step 3: Get chapter info
  console.log(`\n📖 Getting chapter ${CHAPTER_ID} info...`);
  const chapterResponse = await fetch(`${BASE_URL}/api/chapters/${CHAPTER_ID}`, {
    headers: { 'Cookie': cookies }
  });
  
  if (!chapterResponse.ok) {
    console.error('❌ Failed to get chapter info');
    return;
  }
  
  const chapterData = await chapterResponse.json();
  console.log(`✅ Chapter info retrieved: Chapter ${chapterData.chapter.number}`);
  console.log(`🔒 Lock status: ${chapterData.chapter.isLocked ? 'Locked' : 'Unlocked'}`);
  console.log(`🪙 Unlock price: ${chapterData.chapter.unlockPrice || 0} xu`);
  
  if (!chapterData.chapter.isLocked) {
    console.log('⚠️ This chapter is not locked, please choose a locked chapter for testing');
    return;
  }
  
  // Step 4: Check if user has enough balance
  if (userData.balance < chapterData.chapter.unlockPrice) {
    console.log(`⚠️ Insufficient balance for unlocking. You need ${chapterData.chapter.unlockPrice} xu, but have only ${userData.balance} xu`);
    return;
  }
  
  // Step 5: Unlock the chapter
  console.log(`\n🔓 Unlocking chapter ${CHAPTER_ID}...`);
  const unlockResponse = await fetch(`${BASE_URL}/api/chapters/${CHAPTER_ID}/unlock`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Cookie': cookies 
    }
  });
  
  const unlockResult = await unlockResponse.json();
  
  if (!unlockResponse.ok) {
    console.error('❌ Failed to unlock chapter:', unlockResult);
    return;
  }
  
  console.log(`✅ Unlock result: ${unlockResult.message}`);
  console.log(`💰 New balance: ${unlockResult.userBalance} xu`);
  
  // Step 6: Verify unlock status
  console.log(`\n✅ Verifying unlock status...`);
  const verifyResponse = await fetch(`${BASE_URL}/api/chapters/${CHAPTER_ID}`, {
    headers: { 'Cookie': cookies }
  });
  
  if (!verifyResponse.ok) {
    console.error('❌ Failed to verify unlock status');
    return;
  }
  
  const verifyData = await verifyResponse.json();
  console.log(`🔐 Chapter unlock status: ${verifyData.chapter.isUnlocked ? 'Unlocked' : 'Still locked'}`);
  
  // Test complete
  console.log('\n🎉 Test completed!');
}

// Run the test
testChapterUnlock().catch(error => {
  console.error('❌ Test failed with error:', error);
});