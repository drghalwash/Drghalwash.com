
import { createClient } from '@supabase/supabase-js';
import Handlebars from 'handlebars';
import jwt from 'jsonwebtoken';

// Add a comparison helper for Handlebars
Handlebars.registerHelper('eq', function(a, b) {
  return a === b;
});

const supabaseUrl = process.env.SUPABASE_URL || 'https://drwismqxtzpptshsqphb.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyd2lzbXF4dHpwcHRzaHNxcGhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk3MTExNTIsImV4cCI6MjA1NTI4NzE1Mn0.V8C0Fk9u9PS_rc3Kc-X_n-KzStr--m14fKYw9b1BJSI';
const supabase = createClient(supabaseUrl, supabaseKey);
const JWT_SECRET = process.env.JWT_SECRET || 'kemowyaya';

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

/**
 * Checks if a user has access to a private subgallery using JWT
 */
const hasSubgalleryAccess = (req, subgallerySlug) => {
  try {
    // Check for JWT token in cookies
    const token = req.cookies.galleryAccessToken;
    
    if (!token) {
      return false;
    }
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if the token contains access to this specific subgallery
    if (decoded && decoded.subgalleries && decoded.subgalleries.includes(subgallerySlug)) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('[Error] Checking gallery access:', error);
    return false;
  }
};

/**
 * Validate password against the subgallery's password field
 */
export const validatePassword = async (req, res) => {
  try {
    const { slug, password } = req.body;
    console.log('Validating password for subgallery slug:', slug);

    if (!slug || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required parameters: slug and password', 
      });
    }

    // Find the subgallery by slug
    const { data: subgallery, error } = await supabase
      .from('subgallery')
      .select('*, gallery:gallery_id(slug)')
      .eq('slug', slug)
      .single();

    if (error || !subgallery) {
      console.error('Subgallery not found:', error || 'No subgallery returned');
      return res.status(404).json({ success: false, message: 'Subgallery not found' });
    }

    // Check if subgallery is private
    if (subgallery.status !== 'Private') {
      return res.status(400).json({ success: false, message: 'This subgallery is not private' });
    }

    // Parse passwords from subgallery
    let validPins = [];
    if (subgallery.password) {
      const passwordStr = subgallery.password.toString();
      validPins = passwordStr.split(',').map(pin => pin.replace(/["']+/g, '').trim()).filter(pin => pin.length > 0);
    }

    if (validPins.length === 0) {
      return res.status(400).json({ success: false, message: 'This private subgallery has no associated password' });
    }

    // Check if the provided password matches any pins
    const trimmedPassword = password.toString().trim();
    const passwordMatches = validPins.some(pin => {
      if (pin === trimmedPassword) {
        return true;
      }
      
      if (!isNaN(pin) && !isNaN(trimmedPassword)) {
        return Number(pin) === Number(trimmedPassword);
      }
      
      return false;
    });

    if (!passwordMatches) {
      return res.status(401).json({ success: false, message: 'Invalid password' });
    }

    // Generate JWT token with access to this subgallery
    const token = jwt.sign({
      subgalleries: [subgallery.slug],
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // Expires in 24 hours
    }, JWT_SECRET);

    // Set the JWT token as a cookie
    res.cookie('galleryAccessToken', token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'strict'
    });

    // Redirect to the subgallery page
    const redirectUrl = `/galleries/${subgallery.gallery.slug}/${subgallery.slug}`;
    return res.json({
      success: true,
      redirectUrl
    });
  } catch (error) {
    console.error('Error validating password:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
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

    // Handling subgallery request
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

      // Check if this is a private subgallery
      if (subgallery.status === 'Private') {
        // Check if user has access via JWT
        const hasAccess = hasSubgalleryAccess(req, subSlug);
        
        if (!hasAccess) {
          // Redirect to gallery page if no access
          return res.redirect(`/galleries/${slug}`);
        }
      }

      return res.render('Pages/subgallery', {
        gallery,
        subgallery,
        galleries,
        movingBackground2: true,
        'site-footer': true
      });
    }

    // Handling gallery page request
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
