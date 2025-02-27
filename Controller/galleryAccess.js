
import { createClient } from '@supabase/supabase-js';
import cookieParser from 'cookie-parser';

const supabaseUrl = process.env.SUPABASE_URL || 'https://drwismqxtzpptshsqphb.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyd2lzbXF4dHpwcHRzaHNxcGhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk3MTExNTIsImV4cCI6MjA1NTI4NzE1Mn0.V8C0Fk9u9PS_rc3Kc-X_n-KzStr--m14fKYw9b1BJSI';
const supabase = createClient(supabaseUrl, supabaseKey);

// Validate password against the Passwords table
export const validatePassword = async (req, res) => {
  try {
    const { subgalleryId, password } = req.body;
    
    if (!password || !subgalleryId) {
      return res.status(400).json({ success: false, message: 'Password and subgallery ID are required' });
    }

    // Fetch password from the Passwords table - using any valid password
    const { data: passwords, error } = await supabase
      .from('Passwords')
      .select('password')
      .eq('is_used', false);

    if (error) {
      console.error('[Error] Fetching passwords:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }

    // Check if the provided password matches any password in the database
    const isValid = passwords.some(p => p.password.toString() === password.toString());
    
    if (isValid) {
      // Set a cookie to remember this authorization
      res.cookie('gallery_auth', true, {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        httpOnly: true
      });
      
      // Get subgallery info for redirection
      const { data: subgallery } = await supabase
        .from('subgallery')
        .select('slug, gallery_id')
        .eq('id', subgalleryId)
        .single();
        
      if (subgallery) {
        const { data: gallery } = await supabase
          .from('gallery')
          .select('slug')
          .eq('id', subgallery.gallery_id)
          .single();
          
        if (gallery) {
          return res.json({ 
            success: true, 
            redirectUrl: `/${gallery.slug}/${subgallery.slug}`
          });
        }
      }
      
      return res.json({ success: true, redirectUrl: '/' });
    } else {
      return res.status(401).json({ success: false, message: 'Invalid password' });
    }
  } catch (error) {
    console.error('[Error] Password validation:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Check if user is authorized to access password-protected content
export const isAuthorized = (req, res, next) => {
  if (req.cookies && req.cookies.gallery_auth) {
    return next();
  }
  
  // Not authorized - will be handled by the gallery controller
  req.isAuthorized = false;
  return next();
};
