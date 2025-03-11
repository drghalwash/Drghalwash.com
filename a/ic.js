import { readdirSync, statSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { join, basename } from 'path';

// Directory containing Handlebars files
const handlebarsDir = './Templates/Pages';

// Improved regex pattern to catch more image references
const imageRegex = /<img[^>]*src=["']\/images\/[^"']*\.(jpg|jpeg|png)["'][^>]*>|url\(['"]?\/images\/[^"']*\.(jpg|jpeg|png)['"]?\)/gi;

// Expanded heading regex to include more heading types
const headingRegex = /<h1>[^<]*(?:Patient|Town|Body)[^<]*<\/h1>|<div class="site-footer">/i;

// Erase current data in image-references.json if it exists
if (existsSync('./image-references.json')) {
  writeFileSync('./image-references.json', '', 'utf8');
  console.log('Cleared existing image-references.json file');
}

// Function to extract image references
function extractImageReferences(dir) {
  let results = {
    standardImages: [], // Images to be renamed to handlebarsname(n).webp
    preservedImages: [], // Images that keep path and name but change to .webp
    byFile: {}          // Track references by file
  };

  function processFile(filePath) {
    const content = readFileSync(filePath, 'utf8');
    const fileName = basename(filePath, '.handlebars').replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
    
    // Find heading position if exists
    let headingPosition = -1;
    const headingMatch = content.match(headingRegex);
    if (headingMatch) {
      headingPosition = headingMatch.index;
    }
    
    // Find all image references
    let matches = [];
    const regex = new RegExp(imageRegex);
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      // Extract the image path from the match
      const imgTag = match[0];
      const srcMatch = imgTag.match(/src=["']([^"']*)\.(jpg|jpeg|png)["']/i);
      
      if (srcMatch) {
        matches.push({
          fullMatch: match[0],
          position: match.index,
          path: `${srcMatch[1]}.${srcMatch[2]}`
        });
      }
    }
    
    // Process matches based on position
    let standardCount = 0;
    matches.forEach(img => {
      // If heading exists and image is below heading, preserve path and only change extension
      if (headingPosition > -1 && img.position > headingPosition) {
        const originalPath = img.path;
        const webpPath = originalPath.replace(/\.(jpg|jpeg|png)$/, '.webp');
        
        results.preservedImages.push({
          originalPath,
          newPath: webpPath,
          file: fileName
        });
      } else {
        // Standard rename with counter for images above headings
        standardCount++;
        const originalPath = img.path;
        const newPath = `/images/${fileName}${standardCount}.webp`;
        
        results.standardImages.push({
          originalPath,
          newPath,
          file: fileName
        });
      }
    });
    
    // Store by file
    results.byFile[fileName] = {
      standardImages: results.standardImages.filter(img => img.file === fileName),
      preservedImages: results.preservedImages.filter(img => img.file === fileName)
    };
  }
  
  function traverseDirectory(directory) {
    readdirSync(directory).forEach(file => {
      const filePath = join(directory, file);
      if (statSync(filePath).isDirectory()) {
        traverseDirectory(filePath);
      } else if (file.endsWith('.handlebars')) {
        processFile(filePath);
      }
    });
  }
  
  traverseDirectory(dir);
  return results;
}

// Extract and log image references
const results = extractImageReferences(handlebarsDir);
console.log(`Standard Images to Rename: ${results.standardImages.length}`);
console.log(`Preserved Images (Extension Only): ${results.preservedImages.length}`);

// Export results to JSON for other scripts to use
writeFileSync('./image-references.json', JSON.stringify(results, null, 2));

console.log('Image references extracted and saved to image-references.json');
