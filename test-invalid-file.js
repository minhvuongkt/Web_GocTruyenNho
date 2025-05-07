import fs from 'fs';
import { execSync } from 'child_process';

// Test function for testing error handling with invalid file types
async function testInvalidFileUpload() {
  try {
    // Create a test invalid file if it doesn't exist
    if (!fs.existsSync('test-invalid.js')) {
      const invalidContent = "console.log('This is an invalid file type for document upload')";
      fs.writeFileSync('test-invalid.js', invalidContent);
      console.log('Created test-invalid.js');
    } else {
      console.log('Using existing test-invalid.js');
    }

    // Login as admin
    console.log('\nLogging in as admin...');
    execSync('curl -s -c cookies.txt -H "Content-Type: application/json" -d \'{"username":"admin","password":"admin123"}\' http://localhost:5000/api/auth/login');
    
    // Try to upload an invalid file type
    console.log('\nAttempting to upload an invalid file type...');
    try {
      const uploadResponse = execSync(`curl -s -b cookies.txt -F "document=@test-invalid.js" -F "contentId=2" -F "number=12" -F "title=Invalid Test Chapter" -F "isLocked=false" http://localhost:5000/api/upload/chapter-document/2`);
      console.log('Unexpected success:', uploadResponse.toString());
    } catch (e) {
      // This should fail with an error about invalid mime type
      console.log('Expected error occurred:');
      console.log(e.message);
      
      // The response data might be in the error output
      const errorMatch = e.message.match(/<!DOCTYPE html>[\s\S]*<\/html>/);
      if (errorMatch) {
        console.log('Server returned HTML error page');
      } else {
        const jsonMatch = e.message.match(/{[\s\S]*}/);
        if (jsonMatch) {
          try {
            const errorJson = JSON.parse(jsonMatch[0]);
            console.log('Error response:', errorJson);
          } catch (parseErr) {
            console.log('Could not parse error JSON');
          }
        }
      }
    }
    
    // Cleanup
    fs.unlinkSync('cookies.txt');
    fs.unlinkSync('test-invalid.js');
    console.log('\nTest completed and cleaned up');

  } catch (error) {
    console.error('Error during test:', error);
  }
}

// Run the test
testInvalidFileUpload();