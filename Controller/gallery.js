
import { createClient } from '@supabase/supabase-js';
import Handlebars from 'handlebars';

// Add a comparison helper for Handlebars
Handlebars.registerHelper('eq', function(a, b) {
  return a === b;
});

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
      // Process icon path with better fallback mechanisms
      let iconPath = getImagePath(subgallery.icon || null, 'icon');
      
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
 * Arranges subgalleries into rows with appropriate sizing
 * @param {Array} subgalleries - The array of subgallery objects
 * @returns {Array} - Array of row objects, each with items array and row type
 */
const arrangeSubgalleriesInRows = (subgalleries) => {
  // Return empty array if no subgalleries exist
  if (!subgalleries || subgalleries.length === 0) return [];
  
  // Filter valid subgalleries based on name presence
  const validSubgalleries = subgalleries.filter(sg => sg.name && sg.name.trim() !== '');
  if (validSubgalleries.length === 0) return [];
  
  // Initialize rows array and set counters
  const rows = [];
  let currentIndex = 0;
  const totalCount = validSubgalleries.length;
  
  // Determine optimal row arrangement based on total count
  if (totalCount <= 5) {
    // For 1-5 items, use a single row with the count as type
    rows.push({
      type: `row-${totalCount}`,
      items: validSubgalleries
    });
  } else {
    // For more items, create rows with fixed patterns
    while (currentIndex < validSubgalleries.length) {
      const remainingItems = validSubgalleries.length - currentIndex;
      
      if (remainingItems >= 5) {
        // Create a row with 5 items
        rows.push({
          type: 'row-five',
          items: validSubgalleries.slice(currentIndex, currentIndex + 5)
        });
        currentIndex += 5;
      } else if (remainingItems >= 4) {
        // Create a row with 4 items
        rows.push({
          type: 'row-four',
          items: validSubgalleries.slice(currentIndex, currentIndex + 4)
        });
        currentIndex += 4;
      } else if (remainingItems === 3) {
        // Create a row with 3 items
        rows.push({
          type: 'row-three',
          items: validSubgalleries.slice(currentIndex, currentIndex + 3)
        });
        currentIndex += 3;
      } else if (remainingItems === 2) {
        // Create a row with 2 items
        rows.push({
          type: 'row-two',
          items: validSubgalleries.slice(currentIndex, currentIndex + 2)
        });
        currentIndex += 2;
      } else {
        // Create a row with 1 item
        rows.push({
          type: 'row-one',
          items: [validSubgalleries[currentIndex]]
        });
        currentIndex += 1;
      }
    }
  }
  
  return rows;
};

const fetchSubGalleryBySlug = async (gallerySlug, subgallerySlug) => {
  try {
    // Check inputs
    if (!gallerySlug || !subgallerySlug) {
      console.error('[Error] Missing required parameters:', { gallerySlug, subgallerySlug });
      return null;
    }

    // First get the gallery ID
    const { data: gallery, error: galleryError } = await supabase
      .from('gallery')
      .select('id, name')
      .eq('slug', gallerySlug)
      .single();

    if (galleryError) {
      console.error('[Error] Gallery lookup failed:', galleryError.message);
      return null;
    }

    if (!gallery) {
      console.error('[Error] Gallery not found with slug:', gallerySlug);
      return null;
    }

    // Try to extract the numeric ID from the subgallery slug
    // Assuming format like: face-surgery-27-2d97519489c1e845fe3ee11ab50cd380
    let subgalleryId = null;
    const slugParts = subgallerySlug.split('-');
    if (slugParts.length >= 2) {
      subgalleryId = parseInt(slugParts[slugParts.length - 2], 10);
    }

    let subgalleryQuery;
    
    // Query by ID if possible, otherwise fallback to slug
    if (subgalleryId && !isNaN(subgalleryId)) {
      console.log(`[Info] Querying subgallery by ID: ${subgalleryId}`);
      subgalleryQuery = await supabase
        .from('subgallery')
        .select('*')
        .eq('id', subgalleryId)
        .eq('gallery_id', gallery.id)
        .single();
    } else {
      console.log(`[Info] Querying subgallery by slug: ${subgallerySlug}`);
      subgalleryQuery = await supabase
        .from('subgallery')
        .select('*')
        .eq('gallery_id', gallery.id)
        .eq('slug', subgallerySlug)
        .single();
    }

    const { data: subgallery, error: subgalleryError } = subgalleryQuery;

    if (subgalleryError) {
      console.error('[Error] Subgallery query failed:', subgalleryError.message);
      return null;
    }

    if (!subgallery) {
      console.error('[Error] Subgallery not found:', { 
        galleryId: gallery.id, 
        subgalleryId: subgalleryId || 'unknown',
        subgallerySlug 
      });
      return null;
    }
    
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
    
    console.log(`[Success] Found subgallery "${subgallery.name}" (ID: ${subgallery.id}) in gallery "${gallery.name}"`);
    
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

    const sortedSubgalleries = subgalleries.sort((a, b) => a.name.localeCompare(b.name));
    const subgalleryRows = arrangeSubgalleriesInRows(sortedSubgalleries);

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
