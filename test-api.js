import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Get authentication cookie
console.log('Logging in as admin...');
const loginResponse = execSync(`curl -s -c cookies.txt -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}' http://localhost:5000/api/auth/login`);
console.log('Login response:', loginResponse.toString());

// Test uploading a document to create a new chapter
console.log('\nTesting chapter creation from document upload...');
const createChapterResponse = execSync(`curl -s -b cookies.txt -F "document=@test-sample.txt" -F "contentId=2" -F "number=10" -F "title=Test Chapter from API" -F "isLocked=false" http://localhost:5000/api/upload/chapter-document/2`);
console.log('Create chapter response:', createChapterResponse.toString());

// Extract the chapter ID from the response
let chapterId = null;
try {
  const createResponseJson = JSON.parse(createChapterResponse.toString());
  chapterId = createResponseJson.chapter.id;
  console.log(`New chapter created with ID: ${chapterId}`);
} catch (e) {
  console.error('Error parsing create response:', e);
}

// Test updating an existing chapter if we got a valid chapter ID
if (chapterId) {
  console.log('\nTesting chapter update from document upload...');
  const updateChapterResponse = execSync(`curl -s -b cookies.txt -F "document=@test-sample.txt" -F "title=Updated Test Chapter" http://localhost:5000/api/upload/chapter-document/${chapterId}/update`);
  console.log('Update chapter response:', updateChapterResponse.toString());
}

// Clean up
console.log('\nCleaning up cookies file...');
fs.unlinkSync('cookies.txt');
console.log('Done!');