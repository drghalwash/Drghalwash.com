
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://drwismqxtzpptshsqphb.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyd2lzbXF4dHpwcHRzaHNxcGhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk3MTExNTIsImV4cCI6MjA1NTI4NzE1Mn0.V8C0Fk9u9PS_rc3Kc-X_n-KzStr--m14fKYw9b1BJSI';
const supabase = createClient(supabaseUrl, supabaseKey);

const transformGithubUrl = (filename) => {
  if (!filename) return '/images/default-gallery.png';
  return `https://github.com/drghalwash/Test/blob/main/gallery/${filename}?raw=true`;
};

const safeJsonParse = (jsonString, defaultValue = []) => {
  if (!jsonString) return defaultValue;
  try {
    return typeof jsonString === 'string' ? 
      JSON.parse(jsonString.replace(/\\/g, '')) : defaultValue;
  } catch (e) {
    console.error('Error parsing JSON:', e);
    return defaultValue;
  }
};

const fetchGalleries = async () => {
  try {
    const { data: galleries, error } = await supabase.from('gallery').select('*');
    if (error) throw error;
    return galleries || [];
  } catch (error) {
    console.error('[Error] Fetching galleries:', error);
    return [];
  }
};

const fetchGalleryBySlug = async (slug) => {
  try {
    if (!slug) return null;
    
    const { data: gallery, error } = await supabase
      .from('gallery')
      .select('*')
      .eq('slug', slug)
      .single();
      
    if (error || !gallery) return null;

    const imageArray = safeJsonParse(gallery.image);
    
    return {
      ...gallery,
      image: transformGithubUrl(imageArray[0])
    };
  } catch (error) {
    console.error('[Error] Fetching gallery:', error);
    return null;
  }
};

const fetchSubGalleriesByGallerySlug = async (gallerySlug) => {
  try {
    if (!gallerySlug) return [];

    const { data: gallery } = await supabase
      .from('gallery')
      .select('id')
      .eq('slug', gallerySlug)
      .single();

    if (!gallery) return [];

    const { data: subgalleries, error } = await supabase
      .from('subgallery')
      .select('*')
      .eq('gallery_id', gallery.id);

    if (error) return [];
    
    return (subgalleries || []).map(subgallery => ({
      ...subgallery,
      icon: transformGithubUrl(subgallery.icon)
    }));
  } catch (error) {
    console.error('[Error] Fetching subgalleries:', error);
    return [];
  }
};

const fetchSubGalleryBySlug = async (gallerySlug, subgallerySlug) => {
  try {
    if (!gallerySlug || !subgallerySlug) {
      console.error('[Error] Missing gallery or subgallery slug');
      return null;
    }
    console.log(`[Debug] Fetching subgallery: ${subgallerySlug} from gallery: ${gallerySlug}`);

    const { data: gallery } = await supabase
      .from('gallery')
      .select('id')
      .eq('slug', gallerySlug)
      .single();

    if (!gallery) return null;

    const { data: subgallery, error } = await supabase
      .from('subgallery')
      .select('*')
      .eq('gallery_id', gallery.id)
      .eq('slug', subgallerySlug)
      .single();

    if (error || !subgallery) return null;

    const imageArray = safeJsonParse(subgallery.images);
    const processedImages = imageArray.map(filename => ({
      filename,
      url: transformGithubUrl(filename)
    }));

    return {
      ...subgallery,
      icon: transformGithubUrl(subgallery.icon),
      images: processedImages,
      primaryImage: processedImages[0]?.url || '/images/default-gallery.png'
    };
  } catch (error) {
    console.error('[Error] Fetching subgallery:', error);
    return null;
  }
};

export const index = async (req, res) => {
  try {
    const { slug, subSlug } = req.params;
    const galleries = await fetchGalleries();

    if (!slug) {
      return res.status(404).render('error', { 
        error: 'Gallery not found',
        galleries,
        movingBackground2: true,
        'site-footer': true
      });
    }

    if (subSlug) {
      const [gallery, subgallery] = await Promise.all([
        fetchGalleryBySlug(slug),
        fetchSubGalleryBySlug(slug, subSlug)
      ]);

      if (!gallery || !subgallery) {
        return res.status(404).render('error', { 
          error: 'Content not found',
          galleries,
          movingBackground2: true,
          'site-footer': true
        });
      }

      return res.render('Pages/subgallery', {
        gallery,
        subgallery,
        galleries,
        movingBackground2: true,
        'site-footer': true
      });
    }

    const [gallery, subgalleries] = await Promise.all([
      fetchGalleryBySlug(slug),
      fetchSubGalleriesByGallerySlug(slug)
    ]);

    if (!gallery) {
      return res.status(404).render('error', { 
        error: 'Gallery not found',
        galleries,
        movingBackground2: true,
        'site-footer': true
      });
    }

    return res.render('Pages/gallery', {
      gallery,
      subgalleries: subgalleries.sort((a, b) => (a.name || '').localeCompare(b.name || '')),
      galleries,
      movingBackground2: true,
      'site-footer': true
    });
  } catch (error) {
    console.error('[Error] Gallery controller:', error);
    return res.status(500).render('error', { 
      error: 'Server error',
      galleries: [],
      movingBackground2: true,
      'site-footer': true
    });
  }
};
