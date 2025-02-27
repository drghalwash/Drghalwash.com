
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://drwismqxtzpptshsqphb.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyd2lzbXF4dHpwcHRzaHNxcGhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk3MTExNTIsImV4cCI6MjA1NTI4NzE1Mn0.V8C0Fk9u9PS_rc3Kc-X_n-KzStr--m14fKYw9b1BJSI';
const supabase = createClient(supabaseUrl, supabaseKey);

export const validatePassword = async (req, res) => {
  try {
    const { gallerySlug, subgallerySlug, password } = req.body;
    
    // 1. Get the subgallery info
    const { data: gallery } = await supabase
      .from('gallery')
      .select('id')
      .eq('slug', gallerySlug)
      .single();
    
    if (!gallery) {
      return res.status(404).json({ success: false, message: 'Gallery not found' });
    }

    // 2. Find the subgallery and check if it's private
    const { data: subgallery } = await supabase
      .from('subgallery')
      .select('*, password_id')
      .eq('gallery_id', gallery.id)
      .eq('slug', subgallerySlug)
      .single();
    
    if (!subgallery) {
      return res.status(404).json({ success: false, message: 'Subgallery not found' });
    }
    
    // If no password_id, it's public - shouldn't happen but handle it
    if (!subgallery.password_id) {
      return res.status(200).json({ 
        success: true, 
        redirectUrl: `/galleries/${gallerySlug}/${subgallerySlug}` 
      });
    }
    
    // 3. Get the password record and validate
    const { data: passwordRecord } = await supabase
      .from('Passwords')
      .select('password')
      .eq('id', subgallery.password_id)
      .single();
    
    if (!passwordRecord) {
      return res.status(404).json({ success: false, message: 'Password record not found' });
    }
    
    // 4. Check if submitted password matches
    if (passwordRecord.password === password) {
      // Set a session cookie to remember this validation
      res.cookie(`sg_auth_${subgallery.id}`, 'true', { 
        maxAge: 3600000, // 1 hour
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
      });
      
      return res.status(200).json({ 
        success: true, 
        redirectUrl: `/galleries/${gallerySlug}/${subgallerySlug}` 
      });
    } else {
      return res.status(200).json({ success: false, message: 'Invalid password' });
    }
    
  } catch (error) {
    console.error('[Error] Validating password:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Middleware to check if access is allowed to subgallery
export const checkSubgalleryAccess = async (req, res, next) => {
  try {
    const { slug, subSlug } = req.params;
    
    if (!subSlug) {
      // No subgallery specified, continue to gallery page
      return next();
    }
    
    // 1. Get the gallery ID
    const { data: gallery } = await supabase
      .from('gallery')
      .select('id')
      .eq('slug', slug)
      .single();
    
    if (!gallery) {
      return res.status(404).render('error', { 
        error: 'Gallery not found',
        movingBackground2: true,
        'site-footer': true
      });
    }
    
    // 2. Get the subgallery and check if it's password protected
    const { data: subgallery } = await supabase
      .from('subgallery')
      .select('id, status, password_id')
      .eq('gallery_id', gallery.id)
      .eq('slug', subSlug)
      .single();
    
    if (!subgallery) {
      return res.status(404).render('error', { 
        error: 'Subgallery not found',
        movingBackground2: true,
        'site-footer': true
      });
    }
    
    // If it's public or has no password_id, continue
    if (subgallery.status !== 'Private' || !subgallery.password_id) {
      return next();
    }
    
    // Check if user has auth cookie for this subgallery
    if (req.cookies && req.cookies[`sg_auth_${subgallery.id}`]) {
      return next();
    }
    
    // No valid auth, redirect to gallery page with a query param to open modal
    return res.redirect(`/galleries/${slug}?passwordPrompt=true&subgallerySlug=${subSlug}`);
    
  } catch (error) {
    console.error('[Error] Checking subgallery access:', error);
    return next(); // Continue to the main handler which will handle errors
  }
};
