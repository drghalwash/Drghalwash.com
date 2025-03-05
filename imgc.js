const fs = require('fs');
const path = require('path');

// Directory containing Handlebars files
const handlebarsDir = './Templates/Pages';

// Regex to match image paths
const imageRegex = /\/images\/[\w/.-]+\.(jpg|jpeg|png|gif)/g;

// Function to extract image references
function extractImageReferences(dir) {
  let imageReferences = [];
  fs.readdirSync(dir).forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      // Recursively process subdirectories
      imageReferences = imageReferences.concat(extractImageReferences(filePath));
    } else if (file.endsWith('.handlebars')) {
      const content = fs.readFileSync(filePath, 'utf8');
      const matches = content.match(imageRegex);
      if (matches) {
        imageReferences = imageReferences.concat(matches);
      }
    }
  });
  return imageReferences;
}

// Extract and count image references
const imageReferences = extractImageReferences(handlebarsDir);
console.log(`Total Images Found: ${imageReferences.length}`);
console.log('Image References:', imageReferences);
