import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabaseUrl = process.env.SUPABASE_URL || 'https://drwismqxtzpptshsqphb.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyd2lzbXF4dHpwcHRzaHNxcGhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk3MTExNTIsImV4cCI6MjA1NTI4NzE1Mn0.V8C0Fk9u9PS_rc3Kc-X_n-KzStr--m14fKYw9b1BJSI';
const supabase = createClient(supabaseUrl, supabaseKey);

// JWT secret key
const JWT_SECRET = process.env.JWT_SECRET || 'kemowyaya';

// Validate password against the subgallery database
export const validatePassword = async (req, res) => {
  try {
    const { slug, password } = req.body;

    if (!slug || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required parameters: slug and password'
      });
    }

    console.log(`Validating password for subgallery slug: ${slug}`);

    // Query subgallery by slug
    const { data: subgallery, error } = await supabase
      .from('subgallery')
      .select('*, gallery:gallery_id(slug)')
      .eq('slug', slug)
      .single();

    if (error || !subgallery) {
      console.error('Subgallery lookup failed:', error?.message || 'No subgallery found');
      return res.status(404).json({ success: false, message: 'Subgallery not found' });
    }

    // Check if the subgallery is private
    if (subgallery.status !== 'Private') {
      return res.status(400).json({ success: false, message: 'This subgallery is not password protected' });
    }

    // Verify the subgallery has a password
    if (!subgallery.password) {
      return res.status(400).json({ success: false, message: 'This subgallery has no password configured' });
    }

    // Parse password string into array of valid pins
    const validPins = subgallery.password
      .toString()
      .split(',')
      .map(pin => pin.trim().replace(/["']+/g, ''))
      .filter(pin => pin.length > 0);

    // Check if submitted password matches any valid pin
    const passwordMatches = validPins.some(pin => pin === password.trim());

    if (!passwordMatches) {
      return res.status(401).json({ success: false, message: 'Invalid password' });
    }

    // Create JWT token with subgallery info
    const token = jwt.sign({ 
      subgalleryId: subgallery.id,
      gallerySlug: subgallery.gallery.slug,
      subgallerySlug: subgallery.slug,
      authenticated: true,
      timestamp: new Date().toISOString()
    }, JWT_SECRET, { expiresIn: '24h' });

    // Set cookie and return success response
    res.cookie('gallery_auth_token', token, { 
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: true,
      sameSite: 'strict'
    });

    return res.json({ 
      success: true, 
      redirectUrl: `/galleries/${subgallery.gallery.slug}/${subgallery.slug}`
    });
  } catch (error) {
    console.error('Error validating password:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Check if user has access to protected content
export const checkAccess = async (req, res, next) => {
  try {
    const { slug, subSlug } = req.params;

    // Allow access to main gallery pages
    if (!subSlug) {
      return next();
    }

    // Check for JWT token
    const token = req.cookies.gallery_auth_token;

    if (token) {
      try {
        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);

        // If token is valid for this subgallery, allow access
        if (decoded.gallerySlug === slug && 
            decoded.subgallerySlug === subSlug && 
            decoded.authenticated) {
          return next();
        }
      } catch (err) {
        // Token invalid or expired - continue to subgallery status check
        console.log('Token verification failed:', err.message);
      }
    }

    // Check if subgallery is private
    const { data: gallery } = await supabase
      .from('gallery')
      .select('id')
      .eq('slug', slug)
      .single();

    if (!gallery) {
      return next();
    }

    const { data: subgallery } = await supabase
      .from('subgallery')
      .select('status')
      .eq('gallery_id', gallery.id)
      .eq('slug', subSlug)
      .single();

    // If not private or doesn't exist, proceed
    if (!subgallery || subgallery.status !== 'Private') {
      return next();
    }

    // If private and user doesn't have valid token, redirect to gallery
    return res.redirect(`/galleries/${slug}`);
  } catch (error) {
    console.error('Error checking access:', error);
    return next(); // Allow access in case of error
  }
};