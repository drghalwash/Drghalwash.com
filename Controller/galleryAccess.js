
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabaseUrl = process.env.SUPABASE_URL || 'https://drwismqxtzpptshsqphb.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyd2lzbXF4dHpwcHRzaHNxcGhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk3MTExNTIsImV4cCI6MjA1NTI4NzE1Mn0.V8C0Fk9u9PS_rc3Kc-X_n-KzStr--m14fKYw9b1BJSI';
const supabase = createClient(supabaseUrl, supabaseKey);

// JWT secret key - should be moved to environment variables in production
const JWT_SECRET = process.env.JWT_SECRET || 'kemowyaya';
// Token expiration - 7 days by default
const TOKEN_EXPIRY = '7d';

/**
 * Validates password against the subgallery database
 */
export const validatePassword = async (req, res) => {
  try {
    const { slug, password } = req.body;
    
    // Validate required parameters
    if (!slug || !password) {
      console.error('Missing parameters:', { slug: !!slug, password: !!password });
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required parameters: slug and password'
      });
    }
    
    console.log(`Validating password for subgallery slug: ${slug}`);
    
    // First get the gallery ID from the slug
    // Extract gallery slug from subgallery slug pattern (e.g., "face-surgery-27-hash")
    const slugParts = slug.split('-');
    const subgalleryId = parseInt(slugParts[slugParts.length - 2], 10);
    
    if (isNaN(subgalleryId)) {
      console.error('Invalid subgallery slug format:', slug);
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid subgallery identifier'
      });
    }
    
    // Query subgallery directly by ID instead of slug to avoid relationship errors
    const { data: subgallery, error: subgalleryError } = await supabase
      .from('subgallery')
      .select('id, gallery_id, name, slug, status, password')
      .eq('id', subgalleryId)
      .single();
    
    if (subgalleryError) {
      console.error('Supabase subgallery query error:', subgalleryError.message);
      return res.status(500).json({ 
        success: false, 
        message: 'Database error when querying subgallery'
      });
    }
    
    if (!subgallery) {
      console.error('No subgallery found with ID:', subgalleryId);
      return res.status(404).json({ 
        success: false, 
        message: 'Subgallery not found'
      });
    }
    
    // Now get the gallery info in a separate query
    const { data: gallery, error: galleryError } = await supabase
      .from('gallery')
      .select('id, slug')
      .eq('id', subgallery.gallery_id)
      .single();
    
    if (galleryError) {
      console.error('Supabase gallery query error:', galleryError.message);
      return res.status(500).json({ 
        success: false, 
        message: 'Database error when querying gallery'
      });
    }
    
    if (!gallery) {
      console.error('No gallery found for subgallery:', subgallery.id);
      return res.status(404).json({ 
        success: false, 
        message: 'Parent gallery not found'
      });
    }
    
    // Check if the subgallery is private and requires password
    if (subgallery.status !== 'Private') {
      return res.status(400).json({ 
        success: false, 
        message: 'This subgallery is not password protected'
      });
    }
    
    // Verify the subgallery has a password configured
    if (!subgallery.password) {
      console.error('Subgallery has no password configured:', subgallery.id);
      return res.status(400).json({ 
        success: false, 
        message: 'This subgallery has no password configured'
      });
    }
    
    // Parse password string from database into array of valid pins
    let validPins = [];
    try {
      if (typeof subgallery.password === 'string') {
        // Handle comma-separated string
        validPins = subgallery.password
          .split(',')
          .map(pin => pin.trim().replace(/["']+/g, ''))
          .filter(pin => pin.length > 0);
      } else if (Array.isArray(subgallery.password)) {
        // Handle array format
        validPins = subgallery.password
          .map(pin => pin.toString().trim())
          .filter(pin => pin.length > 0);
      }
    } catch (err) {
      console.error('Error parsing password data:', err);
      validPins = [subgallery.password.toString()];
    }
    
    if (validPins.length === 0) {
      console.error('No valid passwords found after parsing:', subgallery.password);
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid password configuration'
      });
    }
    
    // Check if submitted password matches any valid pin
    const submittedPassword = password.trim();
    const passwordMatches = validPins.some(pin => pin === submittedPassword);
    
    if (!passwordMatches) {
      console.log('Invalid password attempt for:', slug);
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid password'
      });
    }
    
    // Password is valid - create JWT token with necessary claims
    const token = jwt.sign({ 
      subgalleryId: subgallery.id,
      galleryId: gallery.id,
      gallerySlug: gallery.slug,
      subgallerySlug: subgallery.slug,
      authenticated: true,
      timestamp: Date.now()
    }, JWT_SECRET, { 
      expiresIn: TOKEN_EXPIRY
    });
    
    // Set JWT in an HTTP-only cookie
    res.cookie('gallery_auth_token', token, { 
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
      httpOnly: true,
      sameSite: 'lax',
      path: '/' // Make cookie available site-wide
    });
    
    console.log('Password validation successful for subgallery ID:', subgallery.id);
    
    // Return success with redirect URL
    return res.json({ 
      success: true, 
      redirectUrl: `/galleries/${gallery.slug}/${subgallery.slug}`
    });
    
  } catch (error) {
    console.error('Error validating password:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error processing your request'
    });
  }
};

/**
 * Middleware to check if user has access to protected content
 */
export const checkAccess = async (req, res, next) => {
  try {
    const { slug, subSlug } = req.params;
    
    // If no subgallery slug, allow access to main gallery page
    if (!subSlug) {
      return next();
    }
    
    // Extract subgallery ID from the slug if it follows our pattern
    let subgalleryId = null;
    const slugParts = subSlug.split('-');
    if (slugParts.length >= 2) {
      subgalleryId = parseInt(slugParts[slugParts.length - 2], 10);
    }
    
    // Check for JWT token in cookies
    const token = req.cookies?.gallery_auth_token;
    
    if (token) {
      try {
        // Verify token validity and authenticity
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // If token is valid for this specific subgallery, allow access
        if (decoded.gallerySlug === slug && 
            decoded.subgallerySlug === subSlug && 
            decoded.authenticated === true) {
          console.log('Auth token valid for:', subSlug);
          return next();
        } else {
          console.log('Token exists but not for this gallery/subgallery');
        }
      } catch (err) {
        // Token invalid or expired - continue to check subgallery status
        console.log('Token verification failed:', err.message);
      }
    }
    
    // If no valid token, check if the subgallery is private
    try {
      // First get the gallery ID
      const { data: gallery, error: galleryError } = await supabase
        .from('gallery')
        .select('id')
        .eq('slug', slug)
        .single();
      
      if (galleryError || !gallery) {
        console.error('Gallery not found:', slug, galleryError?.message || 'No data returned');
        // Gallery not found, let the controller handle the 404
        return next();
      }
      
      // Query approach depends on if we have an ID or need to use the slug
      let subgalleryQuery;
      
      if (subgalleryId && !isNaN(subgalleryId)) {
        // Use ID for more reliable lookup if we can extract it
        subgalleryQuery = await supabase
          .from('subgallery')
          .select('id, status, name, slug')
          .eq('id', subgalleryId)
          .eq('gallery_id', gallery.id)
          .single();
      } else {
        // Fall back to slug lookup
        subgalleryQuery = await supabase
          .from('subgallery')
          .select('id, status, name, slug')
          .eq('gallery_id', gallery.id)
          .eq('slug', subSlug)
          .single();
      }
      
      const { data: subgallery, error: subgalleryError } = subgalleryQuery;
      
      if (subgalleryError) {
        console.error('Error querying subgallery:', subgalleryError.message);
        return next();
      }
      
      // If doesn't exist, allow request to flow to controller for 404 handling
      if (!subgallery) {
        console.log('Subgallery not found in middleware:', subSlug);
        return next();
      }
      
      // If not private, allow access
      if (subgallery.status !== 'Private') {
        console.log('Subgallery is public, granting access:', subgallery.name);
        return next();
      }
      
      // If we reach here, the subgallery is private and user doesn't have a valid token
      console.log('Access denied to private subgallery:', subgallery.name);
      
      // Store subgallery info in session for the password modal
      if (!req.session) {
        req.session = {};
      }
      req.session.pendingPrivateAccess = {
        gallerySlug: slug,
        subgallerySlug: subSlug,
        timestamp: Date.now()
      };
      
      // Redirect to gallery page with a query parameter indicating need for auth
      return res.redirect(`/galleries/${slug}?auth_required=${subSlug}`);
    } catch (error) {
      console.error('Unexpected error in access control middleware:', error);
      return next(); // Allow access in case of error for graceful degradation
    }
  } catch (error) {
    console.error('Error checking access:', error);
    return next(); // Allow access in case of error for graceful degradation
  }
};

/**
 * Clears authentication tokens
 */
export const clearAuth = (req, res) => {
  res.clearCookie('gallery_auth_token', { path: '/' });
  res.redirect('/galleries');
};
