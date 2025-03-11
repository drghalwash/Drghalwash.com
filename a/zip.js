import AdmZip from 'adm-zip';
import { existsSync, mkdirSync } from 'fs';
import { resolve, join } from 'path';

// Function to unzip images.zip to the images directory
async function unzipImages() {
  try {
    const zipPath = resolve('./images.zip');
    const outputPath = resolve('./images');
    
    // Check if the zip file exists
    if (!existsSync(zipPath)) {
      throw new Error(`Zip file not found: ${zipPath}`);
    }
    
    // Create output directory if it doesn't exist
    if (!existsSync(outputPath)) {
      mkdirSync(outputPath, { recursive: true });
      console.log(`Created output directory: ${outputPath}`);
    }
    
    // Initialize the zip file
    const zip = new AdmZip(zipPath);
    
    // Extract everything
    zip.extractAllTo(outputPath, true); // true means overwrite existing files
    
    // Get extraction stats
    const zipEntries = zip.getEntries();
    console.log(`Successfully extracted ${zipEntries.length} files from ${zipPath} to ${outputPath}`);
    
    return {
      success: true,
      fileCount: zipEntries.length
    };
  } catch (error) {
    console.error(`Error unzipping file: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

// Execute the unzip operation
unzipImages()
  .then(result => {
    if (result.success) {
      console.log(`✅ Unzip operation complete. Extracted ${result.fileCount} files.`);
    } else {
      console.error(`❌ Unzip failed: ${result.error}`);
      process.exit(1);
    }
  });
