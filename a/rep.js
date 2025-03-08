import { readdirSync, statSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

function fixImagePaths(dir) {
  readdirSync(dir).forEach(file => {
    const filePath = join(dir, file);
    
    if (statSync(filePath).isDirectory()) {
      // Recursively process subdirectories
      fixImagePaths(filePath);
    } else if (file.endsWith('.handlebars')) {
      let content = readFileSync(filePath, 'utf8');
      
      // Regex to find image paths without leading slash
      // This matches src="images/... or src='images/...
      const regex = /(src=["'])images\//g;
      
      // Replace with src="/images/
      const updatedContent = content.replace(regex, '$1/images/');
      
      // Only write if content changed
      if (content !== updatedContent) {
        writeFileSync(filePath, updatedContent, 'utf8');
        console.log(`Fixed image paths in: ${filePath}`);
      }
    }
  });
}

// Run the script on the Templates/Pages directory
const templatesDir = './Templates/Pages';
fixImagePaths(templatesDir);
console.log('Image path correction completed');
