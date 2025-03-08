import { readdirSync, statSync, unlinkSync, existsSync, mkdirSync } from 'fs';
import { join, dirname, basename, extname } from 'path';
import sharp from 'sharp';

// Source directory containing images
const sourceDir = './images';

// Ensure the source directory exists
if (!existsSync(sourceDir)) {
  console.error(`Source directory ${sourceDir} does not exist!`);
  process.exit(1);
}

// SEO optimization settings
const seoSettings = {
  quality: 80,           // WebP quality (0-100)
  maxWidth: 1920,        // Maximum width for large images
  metadata: true,        // Preserve metadata for SEO
  lossless: false,       // Use lossy compression for smaller files
  effort: 4              // Compression effort (0-6)
};

/**
 * Recursively process all images in a directory
 * @param {string} directory - Directory to process
 * @returns {Promise<{converted: number, skipped: number, totalSaved: number}>}
 */
async function processDirectory(directory) {
  const stats = {
    converted: 0,
    skipped: 0,
    totalSaved: 0
  };

  // Get all files in the directory
  const entries = readdirSync(directory, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(directory, entry.name);
    
    if (entry.isDirectory()) {
      // Recursively process subdirectories
      const subStats = await processDirectory(fullPath);
      stats.converted += subStats.converted;
      stats.skipped += subStats.skipped;
      stats.totalSaved += subStats.totalSaved;
    } else if (/\.(jpe?g|png)$/i.test(entry.name)) {
      // Process image files
      const originalExt = extname(entry.name);
      const baseName = basename(entry.name, originalExt);
      const webpPath = join(directory, `${baseName}.webp`);
      
      try {
        // Get original file size
        const originalStats = statSync(fullPath);
        const originalSize = originalStats.size;
        
        // Get image metadata
        const metadata = await sharp(fullPath).metadata();
        
        // Determine if resizing is needed
        const resizeOptions = {};
        if (metadata.width > seoSettings.maxWidth) {
          resizeOptions.width = seoSettings.maxWidth;
          resizeOptions.fit = 'inside';
          resizeOptions.withoutEnlargement = true;
        }
        
        // Convert to WebP with optimizations
        await sharp(fullPath)
          .resize(resizeOptions)
          .webp({
            quality: seoSettings.quality,
            lossless: seoSettings.lossless,
            effort: seoSettings.effort,
            // Preserve metadata for SEO benefits
            ...(seoSettings.metadata ? {} : { strip: true })
          })
          .toFile(webpPath);
        
        // Get new file size
        const webpStats = statSync(webpPath);
        const webpSize = webpStats.size;
        const savedSize = originalSize - webpSize;
        const savingPercentage = ((savedSize / originalSize) * 100).toFixed(2);
        
        // Delete original file after successful conversion
        unlinkSync(fullPath);
        
        stats.converted++;
        stats.totalSaved += savedSize;
        
        console.log(`✓ Converted: ${fullPath} → ${webpPath}`);
        console.log(`  Size reduction: ${(originalSize / 1024).toFixed(2)}KB → ${(webpSize / 1024).toFixed(2)}KB (${savingPercentage}% saved)`);
      } catch (error) {
        console.error(`✗ Error converting ${fullPath}:`, error.message);
        stats.skipped++;
      }
    }
  }
  
  return stats;
}

// Main function
async function main() {
  console.log(`🔍 Scanning for images in ${sourceDir}...`);
  
  try {
    const startTime = Date.now();
    const stats = await processDirectory(sourceDir);
    const endTime = Date.now();
    
    console.log('\n📊 Conversion Summary:');
    console.log(`✓ Converted: ${stats.converted} images`);
    console.log(`✗ Skipped: ${stats.skipped} images`);
    console.log(`💾 Total space saved: ${(stats.totalSaved / (1024 * 1024)).toFixed(2)}MB`);
    console.log(`⏱️ Process completed in ${((endTime - startTime) / 1000).toFixed(2)} seconds`);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);
