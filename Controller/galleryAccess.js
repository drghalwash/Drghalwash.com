
import { createClient } from '@supabase/supabase-js';
import cookieParser from 'cookie-parser';

const supabaseUrl = process.env.SUPABASE_URL || 'https://drwismqxtzpptshsqphb.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyd2lzbXF4dHpwcHRzaHNxcGhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk3MTExNTIsImV4cCI6MjA1NTI4NzE1Mn0.V8C0Fk9u9PS_rc3Kc-X_n-KzStr--m14fKYw9b1BJSI';
const supabase = createClient(supabaseUrl, supabaseKey);

// Validate the password against the password column in subgallery table
export const validatePassword = async (req, res) => {
  try {
    // ===== COMPREHENSIVE DEBUG LOGGING =====
    console.log("=== FULL REQUEST DEBUG INFO ===");
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    console.log("Request query:", JSON.stringify(req.query, null, 2));
    console.log("Request params:", JSON.stringify(req.params, null, 2));
    console.log("Request headers:", JSON.stringify(req.headers, null, 2));
    console.log("================================");

    // Extract subgalleryId from ALL possible sources with robust conversion
    const possibleIdSources = [
      { value: req.body.subgalleryId, source: 'body.subgalleryId' },
      { value: req.body.imageId, source: 'body.imageId' },
      { value: req.body.id, source: 'body.id' },
      { value: req.query.subgalleryId, source: 'query.subgalleryId' },
      { value: req.query.imageId, source: 'query.imageId' },
      { value: req.query.id, source: 'query.id' },
      { value: req.params.id, source: 'params.id' },
      { value: req.params.subSlug, source: 'params.subSlug' }
    ];

    // Log each source for debugging
    possibleIdSources.forEach(source => {
      console.log(`ID Source [${source.source}]:`, source.value, 
                  source.value !== undefined ? `(type: ${typeof source.value})` : '(undefined)');
    });

    // Find the first non-empty value
    const idSource = possibleIdSources.find(source => 
      source.value !== undefined && source.value !== null && String(source.value).trim() !== ''
    );

    // Handle case where no ID is found
    if (!idSource) {
      console.error('CRITICAL ERROR: No valid subgalleryId found in ANY request properties');
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required parameter: subgalleryId',
        debug: { 
          receivedBody: req.body,
          receivedQuery: req.query,
          receivedParams: req.params,
          receivedHeaders: req.headers
        }
      });
    }

    // Always normalize to string with trimming
    const rawSubgalleryId = idSource.value;
    const subgalleryIdStr = String(rawSubgalleryId).trim();
    
    console.log(`✅ Found valid subgalleryId from ${idSource.source}: '${subgalleryIdStr}'`);
    
    // Get password with fallback to query
    const password = (req.body.password !== undefined) ? req.body.password : req.query.password;
    
    // Password validation
    if (password === undefined || password === '') {
      return res.status(400).json({ success: false, message: 'Missing required parameter: password' });
    }
    
    console.log(`Validating password for subgallery ID (converted): ${subgalleryIdStr}`);

    // Get the subgallery to check if it's private and password protected
    const { data: subgallery, error: subgalleryError } = await supabase
      .from('subgallery')
      .select('*, gallery:gallery_id(slug)')
      .eq('id', subgalleryIdStr)
      .single();
    
    if (subgalleryError || !subgallery) {
      console.error('Subgallery not found:', subgalleryError);
      return res.status(404).json({ success: false, message: 'Subgallery not found' });
    }

    // Check if the subgallery is private
    if (subgallery.status !== 'Private') {
      return res.status(400).json({ success: false, message: 'This subgallery is not private' });
    }

    // If the subgallery is private but doesn't have a password
    if (!subgallery.password) {
      return res.status(400).json({ success: false, message: 'This private subgallery has no associated password' });
    }

    console.log('Subgallery password:', subgallery.password);
    console.log('Submitted password:', password);

    // Parse the password string which contains multiple pins
    let validPins = [];
    try {
      if (subgallery.password) {
        // Convert password value to string
        const passwordString = subgallery.password.toString();
        console.log('Raw password from database:', passwordString);
        
        // Split by commas and properly clean each PIN
        const pinsArray = passwordString.split(',').map(pin => {
          // Remove all quotes and trim whitespace
          return pin.replace(/["']+/g, '').trim();
        });
        
        console.log('Parsed PIN array:', pinsArray);
        
        // Filter out empty strings
        validPins = pinsArray.filter(pin => pin.length > 0);
        console.log('Valid PINs:', validPins);
      }
    } catch (e) {
      console.error('Error parsing password data:', e);
      return res.status(500).json({ success: false, message: 'Server error parsing password data' });
    }

    // Ensure password is trimmed and handle any numeric vs string issues
    const trimmedPassword = password.toString().trim();
    console.log('Checking if provided password:', trimmedPassword, 'matches any valid PINs');
    
    // Try different comparison methods to ensure matching works
    const passwordMatches = validPins.some(pin => {
      // Exact string comparison
      if (pin === trimmedPassword) {
        console.log('Exact string match found for PIN:', pin);
        return true;
      }
      
      // Try comparing as numbers if both are numeric
      if (!isNaN(pin) && !isNaN(trimmedPassword)) {
        const numericMatch = Number(pin) === Number(trimmedPassword);
        if (numericMatch) {
          console.log('Numeric match found for PIN:', pin);
        }
        return numericMatch;
      }
      
      return false;
    });
    
    // Check if the provided password matches any of the pins
    if (passwordMatches) {
      console.log('Password validated successfully');
      
      // Create a URL for redirection
      const redirectUrl = `/galleries/${subgallery.gallery.slug}/${subgallery.slug}`;
      
      // Set a cookie to remember the authenticated state
      // This cookie will be specific to the subgallery
      res.cookie(`auth_${subgallery.id}`, 'true', { 
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        httpOnly: true,
        sameSite: 'strict'
      });
      
      return res.json({ 
        success: true, 
        redirectUrl
      });
    } else {
      console.log('Invalid password provided');
      return res.status(401).json({ success: false, message: 'Invalid password' });
    }
  } catch (error) {
    console.error('Error validating password:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Middleware to check if user has access to a password-protected subgallery
export const checkAccess = async (req, res, next) => {
  try {
    const { slug, subSlug } = req.params;
    
    if (!subSlug) {
      // If not accessing a subgallery, proceed
      return next();
    }

    // Get the gallery ID from the slug
    const { data: gallery } = await supabase
      .from('gallery')
      .select('id')
      .eq('slug', slug)
      .single();
    
    if (!gallery) {
      return next();
    }

    // Get the subgallery details
    const { data: subgallery } = await supabase
      .from('subgallery')
      .select('id, status, password')
      .eq('gallery_id', gallery.id)
      .eq('slug', subSlug)
      .single();
    
    if (!subgallery || subgallery.status !== 'Private') {
      // If subgallery doesn't exist or isn't private, proceed
      return next();
    }

    // Check if user has the auth cookie for this specific subgallery
    const authCookie = req.cookies[`auth_${subgallery.id}`];
    
    if (authCookie) {
      // User has the authentication cookie, allow access
      return next();
    } else {
      // User doesn't have the authentication cookie, redirect to gallery page
      return res.redirect(`/galleries/${slug}`);
    }
  } catch (error) {
    console.error('Error checking access:', error);
    return next(); // Proceed in case of error
  }
};
