
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://drwismqxtzpptshsqphb.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyd2lzbXF4dHpwcHRzaHNxcGhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk3MTExNTIsImV4cCI6MjA1NTI4NzE1Mn0.V8C0Fk9u9PS_rc3Kc-X_n-KzStr--m14fKYw9b1BJSI';
const supabase = createClient(supabaseUrl, supabaseKey);

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
    const { data: gallery, error } = await supabase
      .from('gallery')
      .select('*')
      .eq('slug', slug)
      .single();
    if (error) throw error;
    return gallery;
  } catch (error) {
    console.error('[Error] Fetching gallery:', error);
    return null;
  }
};

const fetchGalleryImagesBySlug = async (gallerySlug) => {
  try {
    const { data: images, error } = await supabase
      .from('galleryimage')
      .select(`
        *,
        password:password_id (
          password
        )
      `)
      .eq('gallery.slug', gallerySlug);
    if (error) throw error;
    return images || [];
  } catch (error) {
    console.error('[Error] Fetching gallery images:', error);
    return [];
  }
};

export const index = async (req, res) => {
  try {
    const { slug } = req.params;
    const [gallery, rawImages, galleries] = await Promise.all([
      fetchGalleryBySlug(slug),
      fetchGalleryImagesBySlug(slug),
      fetchGalleries()
    ]);

    if (!gallery) {
      return res.status(404).render('error', { error: 'Gallery not found' });
    }

    let rowsHtml = '';
    let currentRow = [];
    let rowType = 'first-row';

    rawImages.forEach((image, index) => {
      currentRow.push(image);
      const maxItemsInRow = rowType === 'first-row' ? 5 : 4;

      if (currentRow.length === maxItemsInRow || index === rawImages.length - 1) {
        rowsHtml += `<div class="custom-row ${rowType}">`;
        currentRow.forEach(img => {
          const imageHtml = img.status === 'Public' 
            ? `<a href="/galleries/${slug}/${img.slug}">
                <img src="/images/gallery/${img.icon}" alt="${img.name}" />
                <p>${img.name}</p>
              </a>`
            : `<a href="#" onclick="openModal('${img.id}')">
                <img src="/images/gallery/${img.icon}" alt="${img.name}" />
                <p>${img.name} (Private)</p>
              </a>`;
          
          rowsHtml += `<div class="gallery-item">${imageHtml}</div>`;
        });
        rowsHtml += '</div>';
        
        currentRow = [];
        rowType = rowType === 'first-row' ? 'second-row' : 'first-row';
      }
    });

    res.render('Pages/gallery', { 
      gallery, 
      galleries, 
      rowsHtml,
      movingBackground2: true,
      'site-footer': true
    });
  } catch (error) {
    console.error('[Error] Gallery controller:', error);
    res.status(500).render('error', { error: 'Server error' });
  }
};

export const validatePassword = async (req, res) => {
  try {
    const { imageId, password } = req.body;
    
    const { data: image, error: imageError } = await supabase
      .from('galleryimage')
      .select('*, password:password_id(*)')
      .eq('id', imageId)
      .single();

    if (imageError || !image) {
      return res.json({ success: false });
    }

    const isValid = image.password && image.password.password === password;
    if (isValid) {
      return res.json({ 
        success: true, 
        redirectUrl: `/galleries/${image.gallery.slug}/${image.slug}` 
      });
    }

    return res.json({ success: false });
  } catch (error) {
    console.error('[Error] Password validation:', error);
    return res.json({ success: false });
  }
};
