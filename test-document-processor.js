import fs from 'fs';
import { execSync } from 'child_process';

// Simplified test function focusing on API verification
async function testDocumentUploadAPI() {
  try {
    // Create a test txt file if it doesn't exist
    if (!fs.existsSync('test-sample.txt')) {
      const txtContent = "This is a simple text file for testing.\n\nIt has multiple paragraphs.\n\nEach paragraph should be processed correctly.";
      fs.writeFileSync('test-sample.txt', txtContent);
      console.log('Created test-sample.txt');
    } else {
      console.log('Using existing test-sample.txt');
    }

    // Check if the chapter we created earlier exists in the database
    console.log('\nChecking for the chapter we created through the API...');
    console.log('Logging in as admin...');
    
    // Login and get the chapter
    execSync('curl -s -c cookies.txt -H "Content-Type: application/json" -d \'{"username":"admin","password":"admin123"}\' http://localhost:5000/api/auth/login');
    
    // Test fetching the chapter we created
    console.log('\nFetching chapter data for content 2, chapter 10...');
    const chapterResponse = execSync('curl -s -b cookies.txt http://localhost:5000/api/content/2/chapter/10');
    
    // Parse and display chapter info
    const chapterInfo = JSON.parse(chapterResponse.toString());
    console.log('\nChapter info:', {
      id: chapterInfo.chapter?.id,
      title: chapterInfo.chapter?.title,
      contentId: chapterInfo.chapter?.contentId,
      number: chapterInfo.chapter?.number,
      isLocked: chapterInfo.chapter?.isLocked
    });
    
    // Display a sample of the chapter content
    console.log('\nChapter content sample:');
    if (chapterInfo.contents && chapterInfo.contents.length > 0) {
      const contentSample = chapterInfo.contents[0].content.substring(0, 150) + '...';
      console.log(contentSample);
      console.log('\nContent length:', chapterInfo.contents[0].content.length);
    } else {
      console.log('No content found for this chapter');
    }
    
    // Test creating a new chapter from our document file
    console.log('\nCreating a new chapter from document upload...');
    const createChapterResponse = execSync(`curl -s -b cookies.txt -F "document=@test-sample.txt" -F "contentId=2" -F "number=11" -F "title=Another Test Chapter" -F "isLocked=false" http://localhost:5000/api/upload/chapter-document/2`);
    
    try {
      const createResponseJson = JSON.parse(createChapterResponse.toString());
      console.log(`New chapter created with ID: ${createResponseJson.chapter?.id}`);
      console.log(`Content length: ${createResponseJson.contentLength}`);
    } catch (e) {
      console.error('Error parsing create response:', e);
      console.log('Raw response:', createChapterResponse.toString());
    }
    
    // Cleanup
    fs.unlinkSync('cookies.txt');
    console.log('\nTest completed and cleaned up');

  } catch (error) {
    console.error('Error during test:', error);
  }
}

// Run the test
testDocumentUploadAPI();