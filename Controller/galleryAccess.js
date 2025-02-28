
import { createClient } from '@supabase/supabase-js';
import cookieParser from 'cookie-parser';

const supabaseUrl = process.env.SUPABASE_URL || 'https://drwismqxtzpptshsqphb.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyd2lzbXF4dHpwcHRzaHNxcGhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk3MTExNTIsImV4cCI6MjA1NTI4NzE1Mn0.V8C0Fk9u9PS_rc3Kc-X_n-KzStr--m14fKYw9b1BJSI';
const supabase = createClient(supabaseUrl, supabaseKey);

// Validate the password against the password column in subgallery table
export const validatePassword = async (req, res) => {
  try {
    const { subgalleryId, password } = req.body;
    
    if (!subgalleryId || !password) {
      return res.status(400).json({ success: false, message: 'Missing required parameters' });
    }

    console.log(`Validating password for subgallery ID: ${subgalleryId}`);

    // Get the subgallery to check if it's private and password protected
    const { data: subgallery, error: subgalleryError } = await supabase
      .from('subgallery')
      .select('*, gallery:gallery_id(slug)')
      .eq('id', subgalleryId)
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

    // Parse the password string which contains multiple pins as a JSON array
    let validPins = [];
    try {
      // The password field contains JSON string with pins in quotes
      // Some pins may be in the format "050255" (with quotes)
      const passwordString = subgallery.password.replace(/^"|"$/g, '');
      const pinsArray = passwordString.split(',').map(pin => {
        // Clean up each pin (remove quotes and trim spaces)
        return pin.replace(/^"|"$/g, '').trim();
      });
      validPins = pinsArray;
      console.log('Valid pins:', validPins);
    } catch (e) {
      console.error('Error parsing password JSON:', e);
      return res.status(500).json({ success: false, message: 'Server error parsing password data' });
    }

    // Check if the provided password matches any of the pins
    if (validPins.includes(password)) {
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
