import { readdirSync, statSync, readFileSync } from 'fs';
import { join } from 'path';

// Directory containing Handlebars files
const handlebarsDir = './Templates/Pages';

// Regex to match image paths
const imageRegex = /\/images\/[\w/.-]+\.(jpg|jpeg)/g;

// Function to extract image references
function extractImageReferences(dir) {
  let imageReferences = [];
  readdirSync(dir).forEach(file => {
    const filePath = join(dir, file);
    if (statSync(filePath).isDirectory()) {
      // Recursively process subdirectories
      imageReferences = imageReferences.concat(extractImageReferences(filePath));
    } else if (file.endsWith('.handlebars')) {
      const content = readFileSync(filePath, 'utf8');
      const matches = content.match(imageRegex);
      if (matches) {
        imageReferences = imageReferences.concat(matches);
      }
    }
  });
  return imageReferences;
}

// Extract and log image references
const imageReferences = extractImageReferences(handlebarsDir);
console.log(`Total Images Found: ${imageReferences.length}`);
console.log('Image References:', imageReferences);
