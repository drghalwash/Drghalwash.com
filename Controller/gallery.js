
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://drwismqxtzpptshsqphb.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyd2lzbXF4dHpwcHRzaHNxcGhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk3MTExNTIsImV4cCI6MjA1NTI4NzE1Mn0.V8C0Fk9u9PS_rc3Kc-X_n-KzStr--m14fKYw9b1BJSI';
const supabase = createClient(supabaseUrl, supabaseKey);

const getImagePath = (filename) => `/Upload/images/gallery/${filename}`;

const fetchGalleries = async () => {
  try {
    const { data: galleries, error } = await supabase.from('gallery').select('*');
    if (error) throw error;
    return galleries.map(gallery => ({
      ...gallery,
      image: gallery.image?.length > 0 ? getImagePath(gallery.image[0]) : '/images/default-gallery.jpg'
    }));
  } catch (error) {
    console.error('[Error] Fetching galleries:', error);
    return [];
  }
};

const fetchGalleryBySlug = async (slug) => {
  try {
    const { data: gallery, error } = await supabase
      .from('gallery')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) throw error;
    return gallery ? {
      ...gallery,
      image: gallery.image?.length > 0 ? getImagePath(gallery.image[0]) : '/images/default-gallery.jpg'
    } : null;
  } catch (error) {
    console.error('[Error] Fetching gallery:', error);
    return null;
  }
};

const fetchSubGalleriesByGallerySlug = async (gallerySlug) => {
  try {
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

    if (error) throw error;
    return subgalleries.map(subgallery => ({
      ...subgallery,
      icon: subgallery.icon ? getImagePath(subgallery.icon) : '/images/default-icon.jpg',
      images: Array.isArray(subgallery.images) ? 
        subgallery.images.map(img => getImagePath(img)) : 
        JSON.parse(subgallery.images || '[]').map(img => getImagePath(img))
    }));
  } catch (error) {
    console.error('[Error] Fetching subgalleries:', error);
    return [];
  }
};

const fetchSubGalleryBySlug = async (gallerySlug, subgallerySlug) => {
  try {
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

    return {
      ...subgallery,
      icon: subgallery.icon ? getImagePath(subgallery.icon) : '/images/default-icon.jpg',
      images: Array.isArray(subgallery.images) ? 
        subgallery.images.map(img => getImagePath(img)) : 
        JSON.parse(subgallery.images || '[]').map(img => getImagePath(img))
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
          error: 'Gallery not found',
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

    const sortedSubgalleries = subgalleries.sort((a, b) => a.name.localeCompare(b.name));

    return res.render('Pages/gallery', {
      gallery,
      subgalleries: sortedSubgalleries,
      galleries,
      movingBackground2: true,
      'site-footer': true
    });
  } catch (error) {
    console.error('[Error] Gallery controller:', error);
    res.status(500).render('error', { 
      error: 'Server error',
      galleries: [],
      movingBackground2: true,
      'site-footer': true
    });
  }
};
