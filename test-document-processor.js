import fs from 'fs';
import { execSync } from 'child_process';

async function testDocumentProcessor() {
  try {
    // Create a test txt file
    const txtContent = "This is a simple text file for testing.\n\nIt has multiple paragraphs.\n\nEach paragraph should be processed correctly.";
    fs.writeFileSync('test-upload.txt', txtContent);
    console.log('Created test-upload.txt');

    // Process the text file
    const txtBuffer = fs.readFileSync('test-upload.txt');
    console.log('Processing text file...');
    const txtHtml = await processDocument(txtBuffer, 'text/plain');
    console.log('Processed text file to HTML:', txtHtml.substring(0, 100) + '...');

    // Check if the chapter we created earlier exists in the database
    console.log('\nChecking for the chapter we created through the API...');
    console.log('Logging in as admin...');
    
    // Login and get the chapter
    execSync('curl -s -c cookies.txt -H "Content-Type: application/json" -d \'{"username":"admin","password":"admin123"}\' http://localhost:5000/api/auth/login');
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
    
    // Cleanup
    fs.unlinkSync('test-upload.txt');
    fs.unlinkSync('cookies.txt');
    console.log('\nTest completed and cleaned up');

  } catch (error) {
    console.error('Error during test:', error);
  }
}

// Run the test
testDocumentProcessor();