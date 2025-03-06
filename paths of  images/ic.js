import { readdirSync, statSync, readFileSync } from 'fs';
import { join } from 'path';

// Directory containing Handlebars files
const handlebarsDir = './Templates/Pages';

// Regex to match image paths - captures both /images/file.jpg and /images/subfolder/file.jpg patterns
const imageRegex = /\/images\/[\w/.-]+\.(jpg|jpeg|png|gif)/g;

// Function to extract image references
function extractImageReferences(dir) {
  let imageReferences = [];
  let fileReferences = {}; // Track references by file

  readdirSync(dir).forEach(file => {
    const filePath = join(dir, file);
    if (statSync(filePath).isDirectory()) {
      // Recursively process subdirectories
      const subResults = extractImageReferences(filePath);
      imageReferences = imageReferences.concat(subResults.allReferences);
      Object.assign(fileReferences, subResults.byFile);
    } else if (file.endsWith('.handlebars')) {
      const content = readFileSync(filePath, 'utf8');
      const matches = content.match(imageRegex);
      
      // Store the handlebars filename without extension
      const handlebarName = file.replace('.handlebars', '');
      
      if (matches) {
        imageReferences = imageReferences.concat(matches);
        fileReferences[handlebarName] = matches;
      }
    }
  });

  return {
    allReferences: imageReferences,
    byFile: fileReferences
  };
}

// Extract and log image references
const results = extractImageReferences(handlebarsDir);
console.log(`Total Images Found: ${results.allReferences.length}`);
console.log('Image References by File:');
Object.entries(results.byFile).forEach(([file, refs]) => {
  console.log(`${file}: ${refs.length} images`);
});
