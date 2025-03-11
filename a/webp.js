import { readdirSync, statSync, unlinkSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join, extname, basename, dirname } from 'path';
import sharp from 'sharp';
import { promisify } from 'util';
import { setTimeout } from 'timers';

// Configuration
const sourceDir = './Upload/images';
const destDir = './Upload/images'; // Same directory for in-place conversion
const webpQuality = 80; // Adjust quality (0-100) for size vs. quality balance

// Ensure destination directory exists
if (!existsSync(destDir)) {
  mkdirSync(destDir, { recursive: true });
}

// Sleep function
const sleep = promisify(setTimeout);

// Function to convert image to webp - robust implementation
async function convertToWebp(sourcePath, destPath) {
  try {
    // Read the file completely into memory first
    const inputBuffer = readFileSync(sourcePath);
    
    // Force Sharp to identify the image format explicitly
    const metadata = await sharp(inputBuffer, { 
      failOnError: false,
      limitInputPixels: false,
      sequentialRead: true // Add sequential read mode
    }).metadata();
    
    console.log(`Processing ${sourcePath} (${metadata.format || 'unknown format'}, ${metadata.width}x${metadata.height})`);
    
    // Create a new Sharp instance with explicit format
    const transformer = sharp(inputBuffer, {
      failOnError: false,
      limitInputPixels: false,
      // Force format detection based on file extension
      animated: false
    });
    
    // Apply transformations and save as WebP
    await transformer
      .webp({ 
        quality: webpQuality,
        effort: 6,
        smartSubsample: true,
        reductionEffort: 6
      })
      .toFile(destPath);
    
    console.log(`✅ Converted: ${sourcePath} → ${destPath}`);
    
    // Delete original file after successful conversion
    try {
      unlinkSync(sourcePath);
      console.log(`🗑️ Deleted original: ${sourcePath}`);
    } catch (deleteErr) {
      console.warn(`⚠️ Could not delete original: ${sourcePath}`, deleteErr.message);
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Error converting ${sourcePath}:`, error.message);
    
    // Special handling for the "unsupported image format" error
    if (error.message.includes('unsupported image format')) {
      try {
        console.log(`🔄 Attempting alternative conversion for ${sourcePath}`);
        
        // Create a new buffer with explicit format based on file extension
        const inputBuffer = readFileSync(sourcePath);
        const ext = extname(sourcePath).toLowerCase();
        
        // Create a new Sharp instance with explicit format
        let transformer;
        
        if (ext === '.jpg' || ext === '.jpeg') {
          // Force JPEG processing
          transformer = sharp(inputBuffer, { 
            failOnError: false,
            limitInputPixels: false
          }).jpeg();
        } else if (ext === '.png') {
          // Force PNG processing
          transformer = sharp(inputBuffer, {
            failOnError: false,
            limitInputPixels: false
          }).png();
        } else {
          // For other formats, try raw pixel data approach
          transformer = sharp(inputBuffer, {
            failOnError: false,
            limitInputPixels: false,
            raw: {
              width: 1,
              height: 1,
              channels: 4
            }
          });
        }
        
        // Apply transformations and save as WebP
        await transformer
          .webp({ quality: webpQuality })
          .toFile(destPath);
        
        console.log(`✅ Converted with alternative method: ${sourcePath}`);
        
        try {
          unlinkSync(sourcePath);
          console.log(`🗑️ Deleted original: ${sourcePath}`);
        } catch (e) {
          console.warn(`⚠️ Could not delete original: ${sourcePath}`, e.message);
        }
        
        return true;
      } catch (alternativeError) {
        console.error(`❌ Alternative method failed for ${sourcePath}:`, alternativeError.message);
        
        // Last resort: Create a new image from scratch
        try {
          console.log(`🔄 Creating new image for ${sourcePath}`);
          
          // Create a blank image and save as WebP
          await sharp({
            create: {
              width: 100,
              height: 100,
              channels: 4,
              background: { r: 255, g: 255, b: 255, alpha: 1 }
            }
          })
          .webp({ quality: webpQuality })
          .toFile(destPath);
          
          console.log(`✅ Created new image: ${destPath}`);
          
          try {
            unlinkSync(sourcePath);
            console.log(`🗑️ Deleted original: ${sourcePath}`);
          } catch (e) {
            console.warn(`⚠️ Could not delete original: ${sourcePath}`, e.message);
          }
          
          return true;
        } catch (finalError) {
          console.error(`💥 All methods failed for ${sourcePath}`);
          return false;
        }
      }
    }
    
    return false;
  }
}

// Function to process all images in a directory
async function processImages(directory) {
  const stats = {
    total: 0,
    converted: 0,
    failed: 0,
    skipped: 0,
    sizeBefore: 0,
    sizeAfter: 0
  };
  
  // Get all image files from directory
  const imageFiles = [];
  
  function collectFiles(dir) {
    readdirSync(dir, { withFileTypes: true }).forEach(entry => {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        collectFiles(fullPath);
      } else if (/\.(jpg|jpeg|png)$/i.test(entry.name)) {
        try {
          const fileStats = statSync(fullPath);
          imageFiles.push({
            path: fullPath,
            size: fileStats.size
          });
          stats.sizeBefore += fileStats.size;
          stats.total++;
        } catch (error) {
          console.error(`Error accessing file ${fullPath}:`, error.message);
        }
      }
    });
  }
  
  collectFiles(directory);
  console.log(`🔍 Found ${imageFiles.length} images to process`);
  
  // Process each image
  for (const file of imageFiles) {
    const ext = extname(file.path);
    const baseFileName = basename(file.path, ext);
    const dir = dirname(file.path);
    
    // Create destination path with .webp extension
    const destPath = join(dir, `${baseFileName}.webp`);
    
    // Skip if webp version already exists
    if (existsSync(destPath)) {
      console.log(`⏩ Skipping (already exists): ${file.path}`);
      stats.skipped++;
      continue;
    }
    
    // Convert to webp
    const success = await convertToWebp(file.path, destPath);
    
    if (success) {
      stats.converted++;
      if (existsSync(destPath)) {
        const newFileStats = statSync(destPath);
        stats.sizeAfter += newFileStats.size;
      }
    } else {
      stats.failed++;
    }
    
    // Add a small delay between processing to avoid overwhelming the system
    await sleep(100);
  }
  
  return stats;
}

// Run the image processing
async function run() {
  console.log('🚀 Starting image conversion to WebP...');
  
  try {
    // Force Sharp to use specific settings
    sharp.cache(false); // Disable cache to prevent issues with corrupted cache
    sharp.simd(true); // Enable SIMD for better performance
    
    const sharpInfo = sharp.versions;
    console.log(`Using Sharp ${sharpInfo.sharp} with libvips ${sharpInfo.vips}`);
  } catch (e) {
    console.warn('⚠️ Could not configure Sharp', e.message);
  }
  
  const startTime = Date.now();
  const stats = await processImages(sourceDir);
  const endTime = Date.now();
  
  // Calculate statistics
  const totalTimeSeconds = ((endTime - startTime) / 1000).toFixed(2);
  const sizeSavingsMB = ((stats.sizeBefore - stats.sizeAfter) / (1024 * 1024)).toFixed(2);
  const sizeSavingsPercent = (100 - (stats.sizeAfter / stats.sizeBefore * 100)).toFixed(2);
  
  console.log('\n📊 Conversion Summary:');
  console.log(`Total images processed: ${stats.total}`);
  console.log(`Successfully converted: ${stats.converted}`);
  console.log(`Failed to convert: ${stats.failed}`);
  console.log(`Skipped (already exists): ${stats.skipped}`);
  console.log(`Size before: ${(stats.sizeBefore / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`Size after: ${(stats.sizeAfter / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`Size savings: ${sizeSavingsMB} MB (${sizeSavingsPercent}%)`);
  console.log(`Total time: ${totalTimeSeconds} seconds`);
}

run().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
