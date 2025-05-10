/**
 * Test script to retrieve user's unlocked chapters
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function testUnlockedChapters() {
  try {
    console.log('🔍 Testing user unlocked chapters API...\n');
    
    // Step 1: Login as admin
    console.log('🔑 Logging in...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });
    
    if (!loginResponse.ok) {
      throw new Error('Login failed');
    }
    
    // Get session cookie
    const cookies = loginResponse.headers.raw()['set-cookie'];
    const cookieHeader = cookies ? cookies.join('; ') : '';
    
    console.log('✅ Login successful');
    
    // Step 2: Try to get unlocked chapters for content ID 1
    console.log('\n🔄 Fetching unlocked chapters for content ID 1...');
    
    const contentId = 1;
    const response = await fetch(`${BASE_URL}/api/user/unlocked-chapters/${contentId}`, {
      headers: {
        'Cookie': cookieHeader
      }
    });
    
    if (!response.ok) {
      console.error(`❌ Error: ${response.status} ${response.statusText}`);
      return;
    }
    
    const unlockedChapters = await response.json();
    
    console.log('✅ Successfully retrieved unlocked chapters:');
    console.log(JSON.stringify(unlockedChapters, null, 2));
    
    console.log(`\n📊 Found ${unlockedChapters.length} unlocked chapters`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testUnlockedChapters();