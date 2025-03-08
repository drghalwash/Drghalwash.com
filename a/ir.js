import { readdirSync, statSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Load the image references from the previous script
const imageReferences = JSON.parse(readFileSync('./image-references.json', 'utf8'));

// Directory containing Handlebars files
const handlebarsDir = './Templates/Pages';

// Function to update Handlebars templates
function updateHandlebarsTemplates(dir) {
  let updatedFiles = 0;
  
  function processFile(filePath) {
    try {
      let content = readFileSync(filePath, 'utf8');
      let originalContent = content;
      const fileName = filePath.split('/').pop().replace('.handlebars', '').replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
      
      // Get references for this file
      const fileRefs = imageReferences.byFile[fileName];
      if (!fileRefs) {
        console.log(`No references found for ${fileName}`);
        return;
      }
      
      // Update standard images (handlebarsname + counter)
      fileRefs.standardImages.forEach(img => {
        const escapedPath = img.originalPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(src=["'])${escapedPath}(["'])|url\\(["']?${escapedPath}["']?\\)`, 'g');
        content = content.replace(regex, `$1${img.newPath}$2`);
      });
      
      // Update preserved images (extension only)
      fileRefs.preservedImages.forEach(img => {
        const escapedPath = img.originalPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(src=["'])${escapedPath}(["'])|url\\(["']?${escapedPath}["']?\\)`, 'g');
        content = content.replace(regex, `$1${img.newPath}$2`);
      });
      
      if (content !== originalContent) {
        writeFileSync(filePath, content, 'utf8');
        updatedFiles++;
        console.log(`Updated: ${filePath}`);
      }
    } catch (error) {
      console.error(`Error processing ${filePath}:`, error);
    }
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
  return updatedFiles;
}

const updatedFiles = updateHandlebarsTemplates(handlebarsDir);
console.log(`Updated ${updatedFiles} Handlebars templates`);
