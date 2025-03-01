import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = 'https://drwismqxtzpptshsqphb.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyd2lzbXF4dHpwcHRzaHNxcGhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk3MTExNTIsImV4cCI6MjA1NTI4NzE1Mn0.V8C0Fk9u9PS_rc3Kc-X_n-KzStr--m14fKYw9b1BJSI';
const supabase = createClient(supabaseUrl, supabaseKey);

// JWT secret - in production, this should be stored in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'pK4FJ7hX2sL9qR5tU3vW1yZ8aB6cD0eE';
const TOKEN_EXPIRY = '24h'; // Token expires after 24 hours

// Validate password for a specific gallery
export const validatePassword = async (req, res) => {
  try {
    const { slug } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required' });
    }

    // Get the gallery by slug
    const { data: gallery, error: galleryError } = await supabase
      .from('subgallery')
      .select('id, password, gallery_id')
      .eq('slug', slug)
      .single();

    if (galleryError || !gallery) {
      console.error('Gallery not found:', galleryError);
      return res.status(404).json({ success: false, message: 'Gallery not found' });
    }

    // Check if gallery has a password
    if (!gallery.password) {
      return res.status(200).json({ success: true, message: 'Gallery does not require a password' });
    }

    // Split password string and check if provided password matches any of the valid passwords
    const validPasswords = gallery.password.split(',').map(pw => pw.trim());

    if (validPasswords.includes(password)) {
      // Create a JWT token
      const token = jwt.sign(
        { 
          galleryId: gallery.id,
          parentGalleryId: gallery.gallery_id,
          slug 
        },
        JWT_SECRET,
        { expiresIn: TOKEN_EXPIRY }
      );

      return res.status(200).json({ 
        success: true, 
        message: 'Password is valid',
        token
      });
    } else {
      return res.status(403).json({ success: false, message: 'Invalid password' });
    }
  } catch (error) {
    console.error('Error validating password:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Validate JWT token
export const validateToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ valid: false, message: 'Token is required' });
    }

    // Verify the token
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      return res.status(200).json({ valid: true, decoded });
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError);
      return res.status(403).json({ valid: false, message: 'Token is invalid or expired' });
    }
  } catch (error) {
    console.error('Error validating token:', error);
    return res.status(500).json({ valid: false, message: 'Internal server error' });
  }
};

// Middleware to check if user has access to a password-protected subgallery
export const checkAccess = async (req, res, next) => {
  try {
    const { slug, subSlug } = req.params;
    
    if (!subSlug) {
      return next();
    }

    const token = req.body.token; // Assuming token is sent in the request body

    if (token) {
      try {
        const { valid, decoded } = await validateToken({ body: { token } }, res); // use new function
        if (valid) {
          return next();
        }
      } catch (err) {
        console.log('Token validation error:', err);
      }
    }

    // Get the gallery ID from the slug (This part remains largely the same)
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
      .select('id, status')
      .eq('gallery_id', gallery.id)
      .eq('slug', subSlug)
      .single();
    
    if (!subgallery || subgallery.status !== 'Private') {
      return next();
    }

    return res.redirect(`/galleries/${slug}`);
  } catch (error) {
    console.error('Error checking access:', error);
    return next(); 
  }
};