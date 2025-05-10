import { db } from './server/db.js';
import { storage } from './server/storage.js';

async function testUnlockedChapters() {
  try {
    // Test the isChapterUnlocked method directly
    const userId = 1;
    const chapterId = 2; // The premium chapter we've set up
    
    console.log(`Testing isChapterUnlocked for userId: ${userId}, chapterId: ${chapterId}`);
    const isUnlocked = await storage.isChapterUnlocked(userId, chapterId);
    console.log(`Chapter ${chapterId} unlocked for user ${userId}: ${isUnlocked}`);
    
    // Test the database directly
    const result = await db.execute(
      `SELECT * FROM unlocked_chapters WHERE user_id = $1 AND chapter_id = $2`,
      [userId, chapterId]
    );
    
    console.log('Direct DB query result:', result);
    
    if (!isUnlocked) {
      console.log('Attempting to manually unlock the chapter...');
      const unlockResult = await storage.unlockChapter(userId, chapterId);
      console.log(`Unlock result: ${unlockResult}`);
      
      // Check again after unlocking
      const isUnlockedAfter = await storage.isChapterUnlocked(userId, chapterId);
      console.log(`Chapter ${chapterId} unlocked for user ${userId} after manual unlock: ${isUnlockedAfter}`);
    }
    
    console.log('Test completed successfully');
  } catch (error) {
    console.error('Test failed with error:', error);
  } finally {
    // Clean up
    process.exit(0);
  }
}

testUnlockedChapters();