
import { createClient } from '@supabase/supabase-js';
import cookieParser from 'cookie-parser';

const supabaseUrl = process.env.SUPABASE_URL || 'https://drwismqxtzpptshsqphb.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyd2lzbXF4dHpwcHRzaHNxcGhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk3MTExNTIsImV4cCI6MjA1NTI4NzE1Mn0.V8C0Fk9u9PS_rc3Kc-X_n-KzStr--m14fKYw9b1BJSI';
const supabase = createClient(supabaseUrl, supabaseKey);

// Validate the password against the password column in subgallery table
export const validatePassword = async (req, res) => {
  try {
    // Extract data from request body with detailed logging
    const reqBody = req.body;
    console.log("Full request body received:", reqBody);
    
    // Simplify by just looking for 'id' parameter first
    const rawId = reqBody.id || req.query.id;
    const password = reqBody.password || req.query.password;
    
    console.log("Full request object:", {
      body: req.body,
      query: req.query,
      params: req.params
    });
    
    console.log("Raw ID value:", rawId, "type:", typeof rawId);
    console.log("password value:", password, "type:", typeof password);
    
    // Enhanced validation with simpler logic
    if (!rawId) {
      console.error('Missing ID in request');
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required parameter: id',
        debug: { 
          receivedBody: req.body,
          receivedQuery: req.query,
          receivedParams: req.params
        }
      });
    }
    
    // Always convert to string for consistency
    const idStr = String(rawId).trim();
    console.log(`Using normalized ID: '${idStr}'`);
    
    // Password validation
    if (password === undefined || password === '') {
      return res.status(400).json({ success: false, message: 'Missing required parameter: password' });
    }
    
    console.log(`Validating password for subgallery ID (converted): ${subgalleryIdStr}`);

    // Get the subgallery to check if it's private and password protected
    const { data: subgallery, error: subgalleryError } = await supabase
      .from('subgallery')
      .select('*, gallery:gallery_id(slug)')
      .eq('id', idStr)
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
