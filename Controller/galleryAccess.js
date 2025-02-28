import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = 'https://drwismqxtzpptshsqphb.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyd2lzbXF4dHpwcHRzaHNxcGhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk3MTExNTIsImV4cCI6MjA1NTI4NzE1Mn0.V8C0Fk9u9PS_rc3Kc-X_n-KzStr--m14fKYw9b1BJSI';
const supabase = createClient(supabaseUrl, supabaseKey);

const JWT_SECRET = process.env.JWT_SECRET || 'kemowyaya';

// Validate the password against the password column in subgallery table
export const validatePassword = async (req, res) => {
  try {
    console.log("Password validation request received:", {
      body: req.body,
      query: req.query,
      params: req.params
    });

    // Extract data from request body
    const { slug, password } = req.body;

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

    // Get subgallery by slug
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

    // Compare the provided password with the stored password
    if (subgallery.status !== 'Private') {
      return res.status(400).json({ success: false, message: 'This gallery is not password protected' });
    }

    if (subgallery.password !== password) {
      console.log('Password mismatch');
      return res.status(401).json({ success: false, message: 'Incorrect password' });
    }

    // Password matches, create JWT token
    const token = jwt.sign({
      gallerySlug: subgallery.gallery.slug,
      subgallerySlug: slug,
      authenticated: true,
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 hours
    }, JWT_SECRET);

    // Set JWT token as cookie
    res.cookie('gallery_auth_token', token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    // Return success and redirect URL
    return res.status(200).json({
      success: true,
      message: 'Password correct',
      redirectUrl: `/gallery/${subgallery.gallery.slug}/${slug}`
    });
  } catch (error) {
    console.error('Error in validatePassword:', error);
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
      return res.status(404).render('Pages/404', { error: 'Gallery not found' });
    }

    // Get the subgallery details
    const { data: subgallery } = await supabase
      .from('subgallery')
      .select('id, status')
      .eq('gallery_id', gallery.id)
      .eq('slug', subSlug)
      .single();

    if (!subgallery) {
      return res.status(404).render('Pages/404', { error: 'Subgallery not found' });
    }

    if (subgallery.status !== 'Private') {
      // If subgallery isn't private, proceed
      return next();
    }

    // If we reach here, the subgallery is private and the user doesn't have a valid token
    // Redirect to the gallery page
    return res.redirect(`/gallery/${slug}`);
  } catch (error) {
    console.error('Error in checkAccess middleware:', error);
    return res.status(500).render('Pages/404', { error: 'Server error' });
  }
};