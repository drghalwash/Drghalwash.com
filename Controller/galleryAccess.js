
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';

const supabaseUrl = process.env.SUPABASE_URL || 'https://drwismqxtzpptshsqphb.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyd2lzbXF4dHpwcHRzaHNxcGhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk3MTExNTIsImV4cCI6MjA1NTI4NzE1Mn0.V8C0Fk9u9PS_rc3Kc-X_n-KzStr--m14fKYw9b1BJSI';
const supabase = createClient(supabaseUrl, supabaseKey);

// JWT secret key - using the provided secret
const JWT_SECRET = process.env.JWT_SECRET || 'kemowyaya';

// Validate the password against the password column in subgallery table
export const validatePassword = async (req, res) => {
  try {
    console.log("Password validation request received:", {
      body: req.body,
      query: req.query,
      params: req.params
    });
    
    // Extract slug and password from request
    let slug, password;
    
    // Check if the request is JSON or form data
    if (req.is('application/json')) {
      ({ slug, password } = req.body);
    } else {
      // For form-urlencoded
      slug = req.body.slug;
      password = req.body.password;
    }
    
    if (!slug) {
      console.error('Missing required parameter: slug');
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required parameter: slug'
      });
    }
    
    if (!password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required parameter: password'
      });
    }
    
    console.log(`Validating password for subgallery slug: ${slug}`);

    // Get gallery and subgallery by slug
    const { data: subgallery, error: subgalleryError } = await supabase
      .from('subgallery')
      .select('*, gallery:gallery_id(slug)')
      .eq('slug', slug)
      .single();
    
    if (subgalleryError || !subgallery) {
      console.error('Subgallery lookup failed:', {
        slug,
        error: subgalleryError ? subgalleryError.message : 'No subgallery found'
      });
      return res.status(404).json({ success: false, message: 'Subgallery not found' });
    }
    
    console.log(`Found subgallery: ID=${subgallery.id}, Status=${subgallery.status}`);

    // Check if the subgallery is private
    if (subgallery.status !== 'Private') {
      return res.status(400).json({ success: false, message: 'This subgallery is not private' });
    }

    // If the subgallery is private but doesn't have a password
    if (!subgallery.password) {
      return res.status(400).json({ success: false, message: 'This private subgallery has no associated password' });
    }

    // Parse the password string which contains multiple pins
    let validPins = [];
    try {
      if (subgallery.password) {
        const passwordString = subgallery.password.toString();
        console.log(`Raw password data: ${passwordString}`);
        
        const pinsArray = passwordString.split(',').map(pin => {
          return pin.replace(/["']+/g, '').trim();
        });
        validPins = pinsArray.filter(pin => pin.length > 0);
        console.log(`Parsed valid pins: ${JSON.stringify(validPins)}`);
      } else {
        console.warn(`Subgallery ${subgallery.id} has no password set but is marked as private`);
      }
    } catch (e) {
      console.error('Error parsing password data:', e);
      return res.status(500).json({ success: false, message: 'Server error parsing password data' });
    }

    // Check if the provided password matches any of the pins
    const trimmedPassword = password.toString().trim();
    const passwordMatches = validPins.some(pin => {
      // Exact string comparison
      if (pin === trimmedPassword) {
        return true;
      }
      
      // Try comparing as numbers if both are numeric
      if (!isNaN(pin) && !isNaN(trimmedPassword)) {
        return Number(pin) === Number(trimmedPassword);
      }
      
      return false;
    });
    
    if (passwordMatches) {
      console.log('Password validated successfully for subgallery ID:', subgallery.id);
      
      try {
        // Create a JWT token with subgallery info
        const token = jwt.sign(
          { 
            subgalleryId: subgallery.id,
            gallerySlug: subgallery.gallery.slug,
            subgallerySlug: subgallery.slug,
            authenticated: true,
            timestamp: new Date().toISOString()
          }, 
          JWT_SECRET,
          { expiresIn: '24h' }
        );
        
        // Create redirect URL
        const redirectUrl = `/galleries/${subgallery.gallery.slug}/${subgallery.slug}`;
        
        // Set the JWT token as a cookie
        res.cookie('gallery_auth_token', token, { 
          maxAge: 24 * 60 * 60 * 1000, // 24 hours
          httpOnly: true,
          sameSite: 'strict'
        });
        
        console.log(`Authentication successful, redirecting to: ${redirectUrl}`);
        
        return res.json({ 
          success: true, 
          redirectUrl
        });
      } catch (jwtError) {
        console.error('JWT signing error:', jwtError);
        return res.status(500).json({ success: false, message: 'Server error creating authentication token' });
      }
    } else {
      console.log('Invalid password provided for subgallery:', subgallery.id);
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

    // First check for JWT token
    const token = req.cookies.gallery_auth_token;
    
    if (token) {
      try {
        // Verify the token
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Check if token is for the requested subgallery
        if (decoded.gallerySlug === slug && decoded.subgallerySlug === subSlug && decoded.authenticated) {
          // Token is valid for this subgallery, allow access
          return next();
        }
      } catch (err) {
        console.log('Invalid or expired token:', err.message);
        // Continue to next authentication method if token is invalid
      }
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
      .select('id, status')
      .eq('gallery_id', gallery.id)
      .eq('slug', subSlug)
      .single();
    
    if (!subgallery || subgallery.status !== 'Private') {
      // If subgallery doesn't exist or isn't private, proceed
      return next();
    }

    // If we get here, the subgallery is private and the user doesn't have valid authentication
    // Redirect to gallery page
    return res.redirect(`/galleries/${slug}`);
  } catch (error) {
    console.error('Error checking access:', error);
    return next(); // Proceed in case of error
  }
};
