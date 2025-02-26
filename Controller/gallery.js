import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://drwismqxtzpptshsqphb.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyd2lzbXF4dHpwcHRzaHNxcGhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk3MTExNTIsImV4cCI6MjA1NTI4NzE1Mn0.V8C0Fk9u9PS_rc3Kc-X_n-KzStr--m14fKYw9b1BJSI';
const supabase = createClient(supabaseUrl, supabaseKey);

const processImageUrl = (filename) => {
  return filename ? `https://github.com/drghalwash/Test/blob/main/gallery/${filename}?raw=true` : '/images/default-gallery.png';
};

const processImagesArray = (imagesStr) => {
  try {
    return JSON.parse(imagesStr.replace(/\\/g, '')).map(img => ({
      filename: img,
      url: processImageUrl(img)
    }));
  } catch (e) {
    console.error('Error parsing images array:', e);
    return [];
  }
};

export const index = async (req, res) => {
  try {
    const { slug, subSlug } = req.params;

    if (!slug) {
      return res.status(404).render('error', { 
        error: 'Gallery not found',
        movingBackground2: true,
        'site-footer': true
      });
    }

    if (subSlug) {
      // Fetch subgallery details
      const { data: gallery } = await supabase
        .from('gallery')
        .select('*')
        .eq('slug', slug)
        .single();

      const { data: subgallery } = await supabase
        .from('subgallery')
        .select('*')
        .eq('gallery_id', gallery.id)
        .eq('slug', subSlug)
        .single();

      if (!gallery || !subgallery) {
        return res.status(404).render('error', { 
          error: 'Gallery not found',
          movingBackground2: true,
          'site-footer': true
        });
      }

      const processedImages = processImagesArray(subgallery.images);

      return res.render('Pages/subgallery', {
        gallery,
        subgallery: {
          ...subgallery,
          icon: processImageUrl(subgallery.icon),
          images: processedImages,
          primaryImage: processedImages[0]?.url || '/images/default-gallery.png'
        },
        movingBackground2: true,
        'site-footer': true
      });
    }

    // Fetch main gallery and its subgalleries
    const [{ data: gallery }, { data: subgalleries }] = await Promise.all([
      supabase.from('gallery').select('*').eq('slug', slug).single(),
      supabase.from('subgallery').select('*').eq('gallery_id', gallery.id)
    ]);

    if (!gallery) {
      return res.status(404).render('error', { 
        error: 'Gallery not found',
        movingBackground2: true,
        'site-footer': true
      });
    }

    const processedSubgalleries = subgalleries.map(sub => ({
      ...sub,
      icon: processImageUrl(sub.icon),
      images: processImagesArray(sub.images)
    }));

    return res.render('Pages/gallery', {
      gallery: {
        ...gallery,
        image: processImageUrl(JSON.parse(gallery.image)[0])
      },
      subgalleries: processedSubgalleries,
      movingBackground2: true,
      'site-footer': true
    });

  } catch (error) {
    console.error('[Error] Gallery controller:', error);
    res.status(500).render('error', { 
      error: 'Server error',
      movingBackground2: true,
      'site-footer': true
    });
  }
};