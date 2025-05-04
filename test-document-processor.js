import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simulate sending a request to the document processor
async function testDocumentProcessor() {
  try {
    // Create a sample text file
    const sampleText = "This is a test document.\nLine 2 of the test document.\n\nA paragraph with blank lines.";
    fs.writeFileSync('sample.txt', sampleText);
    
    // Read the file
    const buffer = fs.readFileSync('sample.txt');
    
    // Import the document processor
    const documentProcessorModule = await import('./server/document-processor.js');
    const { processDocument } = documentProcessorModule;
    
    // Process the document
    console.log('Processing document...');
    const result = await processDocument(buffer, 'text/plain');
    
    // Show the result
    console.log('\nProcessed Result:');
    console.log(result);
    
    // Clean up
    fs.unlinkSync('sample.txt');
    console.log('\nTest completed successfully!');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testDocumentProcessor();