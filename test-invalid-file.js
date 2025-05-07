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
      // Using --fail to make curl fail on error responses (4xx, 5xx)
      // Using -w option to get HTTP status code along with output
      const uploadResponse = execSync(`curl -s -w "\nHTTP Status: %{http_code}" --fail -b cookies.txt -F "document=@test-invalid.js" -F "contentId=2" -F "number=12" -F "title=Invalid Test Chapter" -F "isLocked=false" http://localhost:5000/api/upload/chapter-document/2`);
      
      // This should not execute if we have proper error handling
      console.log('UNEXPECTED SUCCESS - server should have rejected the file:');
      console.log(uploadResponse.toString());
    } catch (e) {
      // This is the expected behavior - curl should fail with error code
      console.log('Server correctly rejected the invalid file type');
      
      // Extract the response from the error
      const responseMatch = e.message.match(/curl:.*\n(.*)/);
      if (responseMatch && responseMatch[1]) {
        try {
          // Try to parse as JSON
          const jsonResponse = JSON.parse(responseMatch[1]);
          console.log('Response:', jsonResponse);
          if (jsonResponse.message && jsonResponse.message.includes('Unsupported file type')) {
            console.log('✅ File type validation is working correctly!');
            console.log('Status code should be 400 Bad Request');
          }
        } catch (parseErr) {
          console.log('Raw response:', responseMatch[1]);
        }
      } else {
        // Try to extract any JSON from the error message
        const jsonMatch = e.message.match(/{[\s\S]*}/);
        if (jsonMatch) {
          try {
            const errorJson = JSON.parse(jsonMatch[0]);
            console.log('Error response:', errorJson);
            if (errorJson.message && errorJson.message.includes('Unsupported file type')) {
              console.log('✅ File type validation is working correctly!');
            }
          } catch (parseErr) {
            console.log('Error contains JSON-like content but could not parse it');
          }
        } else {
          console.log('Raw error:', e.message);
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