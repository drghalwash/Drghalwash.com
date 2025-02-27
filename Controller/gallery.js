
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://drwismqxtzpptshsqphb.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyd2lzbXF4dHpwcHRzaHNxcGhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk3MTExNTIsImV4cCI6MjA1NTI4NzE1Mn0.V8C0Fk9u9PS_rc3Kc-X_n-KzStr--m14fKYw9b1BJSI';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Standardizes image paths for gallery and subgallery images
 * @param {string|null} filename - The filename or path to process
 * @param {string} type - The type of image ('gallery', 'icon', or 'subgallery')
 * @returns {string} - The standardized image path
 */
const getImagePath = (filename, type = 'gallery') => {
  // Handle null, undefined or empty string
  if (!filename) {
    return type === 'icon' ? '/images/gallery/default-icon.jpg' : '/images/gallery/default.jpg';
  }
  
  // If it's already a valid URL or absolute path, return as is
  if (filename.startsWith('http') || filename.startsWith('https')) {
    return filename;
  }
  
  // If it's already in the proper format, return as is
  if (filename.startsWith('/images/gallery/')) {
    return filename;
  }
  
  // Clean the filename of quotes and brackets if it appears to be from JSON
  let cleanFilename = filename;
  if (typeof filename === 'string') {
    cleanFilename = filename.replace(/["[\]\{\}]/g, '').trim();
  }
  
  // Handle filepaths with extensions
  if (typeof cleanFilename === 'string' && 
      (cleanFilename.endsWith('.jpg') || 
       cleanFilename.endsWith('.jpeg') || 
       cleanFilename.endsWith('.png') || 
       cleanFilename.endsWith('.gif') || 
       cleanFilename.endsWith('.webp'))) {
    return `/images/gallery/${cleanFilename}`;
  }
  
  // Return default for the appropriate type
  return type === 'icon' ? '/images/gallery/default-icon.jpg' : '/images/gallery/default.jpg';
};

/**
 * Safely parse JSON strings or return empty array if invalid
 * @param {string|null} jsonString - The JSON string to parse
 * @returns {Array} - The parsed array or empty array
 */
const safeJsonParse = (jsonString) => {
  if (!jsonString) return [];
  
  // If it's already an array, return it
  if (Array.isArray(jsonString)) return jsonString;
  
  try {
    const parsed = JSON.parse(jsonString);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('[Error] Parsing JSON:', error);
    return [];
  }
};

const fetchGalleries = async () => {
  try {
    const { data: galleries, error } = await supabase.from('gallery').select('*');
    if (error) throw error;
    
    return galleries.map(gallery => ({
      ...gallery, 
      image: gallery.image ? getImagePath(
        Array.isArray(gallery.image) ? gallery.image[0] : 
        safeJsonParse(gallery.image)[0] || gallery.image
      ) : '/images/gallery/default.jpg'
    }));
  } catch (error) {
    console.error('[Error] Fetching galleries:', error);
    return [];
  }
};

const fetchGalleryBySlug = async (slug) => {
  try {
    const { data: gallery, error } = await supabase
      .from('gallery')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) throw error;
    
    if (!gallery) return null;
    
    // Process the image path
    let imagePath = '/images/gallery/default.jpg';
    
    if (gallery.image) {
      // Handle both string JSON and array formats
      if (typeof gallery.image === 'string') {
        try {
          const images = safeJsonParse(gallery.image);
          imagePath = images.length > 0 ? getImagePath(images[0]) : '/images/gallery/default.jpg';
        } catch (e) {
          imagePath = getImagePath(gallery.image);
        }
      } else if (Array.isArray(gallery.image)) {
        imagePath = gallery.image.length > 0 ? getImagePath(gallery.image[0]) : '/images/gallery/default.jpg';
      }
    }
    
    return {
      ...gallery,
      image: imagePath
    };
  } catch (error) {
    console.error('[Error] Fetching gallery:', error);
    return null;
  }
};

const fetchSubGalleriesByGallerySlug = async (gallerySlug) => {
  try {
    const { data: gallery } = await supabase
      .from('gallery')
      .select('id')
      .eq('slug', gallerySlug)
      .single();

    if (!gallery) return [];

    const { data: subgalleries, error } = await supabase
      .from('subgallery')
      .select('*')
      .eq('gallery_id', gallery.id);

    if (error) throw error;
    
    return subgalleries.map(subgallery => {
      // Process icon path
      const iconPath = getImagePath(subgallery.icon, 'icon');
      
      // Process image array
      const rawImages = subgallery.images;
      let processedImages = [];
      
      if (typeof rawImages === 'string') {
        processedImages = safeJsonParse(rawImages).map(img => getImagePath(img));
      } else if (Array.isArray(rawImages)) {
        processedImages = rawImages.map(img => getImagePath(img));
      }
      
      return {
        ...subgallery,
        icon: iconPath,
        images: processedImages
      };
    });
  } catch (error) {
    console.error('[Error] Fetching subgalleries:', error);
    return [];
  }
};

/**
 * Arranges subgalleries into rows with varying item counts following a pattern
 * @param {Array} subgalleries - The array of subgallery objects
 * @returns {Array} - Array of row objects with specific type and items
 */
const arrangeSubgalleriesInRows = (subgalleries) => {
  if (!subgalleries || subgalleries.length === 0) return [];
  
  // Create a deep copy to avoid mutating the original array
  const subgalleriesCopy = [...subgalleries];
  const rows = [];
  
  // Process all subgalleries in batches of 10 (5+4+1 pattern)
  while (subgalleriesCopy.length > 0) {
    // First row pattern: 5 items (or remaining if less than 5)
    const firstRowItems = subgalleriesCopy.splice(0, Math.min(5, subgalleriesCopy.length));
    if (firstRowItems.length > 0) {
      rows.push({
        type: 'row-five',
        items: firstRowItems
      });
    }
    
    // Second row pattern: 4 items (or remaining if less than 4)
    if (subgalleriesCopy.length > 0) {
      const secondRowItems = subgalleriesCopy.splice(0, Math.min(4, subgalleriesCopy.length));
      if (secondRowItems.length > 0) {
        rows.push({
          type: 'row-four',
          items: secondRowItems
        });
      }
    }
    
    // Third row pattern: 1 featured item
    if (subgalleriesCopy.length > 0) {
      const featuredItem = subgalleriesCopy.splice(0, 1);
      rows.push({
        type: 'row-one',
        items: featuredItem
      });
    }
  }
  
  // Debug the row structure
  console.log('Generated row structure:', 
    rows.map(row => ({
      type: row.type, 
      itemCount: row.items.length,
      itemNames: row.items.map(item => item.name)
    }))
  );
  
  return rows;
};

const fetchSubGalleryBySlug = async (gallerySlug, subgallerySlug) => {
  try {
    const { data: gallery } = await supabase
      .from('gallery')
      .select('id')
      .eq('slug', gallerySlug)
      .single();

    if (!gallery) return null;

    const { data: subgallery, error } = await supabase
      .from('subgallery')
      .select('*')
      .eq('gallery_id', gallery.id)
      .eq('slug', subgallerySlug)
      .single();

    if (error || !subgallery) return null;
    
    // Handle icon path
    const iconPath = getImagePath(subgallery.icon, 'icon');
    
    // Handle images array with robust parsing
    let processedImages = [];
    const rawImages = subgallery.images;
    
    if (typeof rawImages === 'string') {
      processedImages = safeJsonParse(rawImages).map(img => getImagePath(img));
    } else if (Array.isArray(rawImages)) {
      processedImages = rawImages.map(img => getImagePath(img));
    }
    
    return {
      ...subgallery,
      icon: iconPath,
      images: processedImages
    };
  } catch (error) {
    console.error('[Error] Fetching subgallery:', error);
    return null;
  }
};

export const index = async (req, res) => {
  try {
    const { slug, subSlug } = req.params;
    const galleries = await fetchGalleries();

    if (!slug) {
      return res.status(404).render('error', { 
        error: 'Gallery not found',
        galleries,
        movingBackground2: true,
        'site-footer': true
      });
    }

    if (subSlug) {
      const [gallery, subgallery] = await Promise.all([
        fetchGalleryBySlug(slug),
        fetchSubGalleryBySlug(slug, subSlug)
      ]);

      if (!gallery || !subgallery) {
        return res.status(404).render('error', { 
          error: 'Gallery not found',
          galleries,
          movingBackground2: true,
          'site-footer': true
        });
      }

      return res.render('Pages/subgallery', {
        gallery,
        subgallery,
        galleries,
        movingBackground2: true,
        'site-footer': true
      });
    }

    const [gallery, subgalleries] = await Promise.all([
      fetchGalleryBySlug(slug),
      fetchSubGalleriesByGallerySlug(slug)
    ]);

    if (!gallery) {
      return res.status(404).render('error', { 
        error: 'Gallery not found',
        galleries,
        movingBackground2: true,
        'site-footer': true  
      });
    }

    // Filter out any invalid subgalleries (missing required fields)
    const validSubgalleries = subgalleries.filter(sub => 
      sub && typeof sub === 'object' && sub.name && sub.slug
    );
    
    if (validSubgalleries.length < subgalleries.length) {
      console.warn(`[Warning] Filtered out ${subgalleries.length - validSubgalleries.length} invalid subgalleries`);
    }
    
    const sortedSubgalleries = validSubgalleries.sort((a, b) => a.name.localeCompare(b.name));
    const subgalleryRows = arrangeSubgalleriesInRows(sortedSubgalleries);
    
    // Debug: Log the structure of subgalleryRows
    console.log(`Gallery [${gallery.name}] has ${sortedSubgalleries.length} subgalleries in ${subgalleryRows.length} rows`);

    return res.render('Pages/gallery', {
      gallery,
      subgalleries: sortedSubgalleries,
      subgalleryRows,
      galleries,
      movingBackground2: true,
      'site-footer': true
    });
  } catch (error) {
    console.error('[Error] Gallery controller:', error);
    res.status(500).render('error', { 
      error: 'Server error',
      galleries: [],
      movingBackground2: true,
      'site-footer': true
    });
  }
};
