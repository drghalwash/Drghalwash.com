// Import Supabase client
import { createClient } from '@supabase/supabase-js';

// Supabase Configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://drwismqxtzpptshsqphb.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyd2lzbXF4dHpwcHRzaHNxcGhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk3MTExNTIsImV4cCI6MjA1NTI4NzE1Mn0.V8C0Fk9u9PS_rc3Kc-X_n-KzStr--m14fKYw9b1BJSI';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Fetch all galleries for the navbar.
 */
const fetchAllGalleries = async () => {
  try {
    const { data: galleries, error } = await supabase.from('gallery').select('*');
    if (error) throw new Error(`Error fetching galleries: ${error.message}`);
    return galleries || [];
  } catch (error) {
    console.error('[Error] Fetching all galleries:', error.message);
    return [];
  }
};

/**
 * Fetch gallery metadata by slug.
 */
const fetchGalleryBySlug = async (slug) => {
  try {
    const { data: gallery, error } = await supabase.from('gallery').select('*').eq('slug', slug).single();
    if (error) throw new Error(`Error fetching gallery with slug "${slug}": ${error.message}`);
    return gallery;
  } catch (error) {
    console.error('[Gallery] Error in fetchGalleryBySlug:', error.message);
    return null;
  }
};

/**
 * Fetch all images for a gallery by its slug.
 */
const fetchGalleryImagesBySlug = async (gallerySlug) => {
  try {
    const { data: images, error } = await supabase.from('galleryimage').select('*').eq('gallery.slug', gallerySlug);
    if (error) throw new Error(`Error fetching images for gallery "${gallerySlug}": ${error.message}`);
    return images || [];
  } catch (error) {
    console.error('[Gallery] Error in fetchGalleryImagesBySlug:', error.message);
    return [];
  }
};

/**
 * Controller: Render the main gallery page.
 */
export const index = async (req, res) => {
  try {
    const { slug } = req.params;

    // Fetch all required data in parallel
    const [gallery, rawImages, galleries] = await Promise.all([
      fetchGalleryBySlug(slug),
      fetchGalleryImagesBySlug(slug),
      fetchAllGalleries(),
    ]);

    if (!gallery) return res.status(404).render('error', { error: 'Gallery not found' });

    // Sanitize images to handle missing/incorrect data
    const sanitizedImages = rawImages.map((image) => ({
      id: image.id || 'unknown-id',
      slug: image.slug || 'unknown-slug',
      name: image.name || 'Untitled',
      icon: image.icon || 'default-icon.png', // Use default icon if missing
      status: image.status || 'Public',
    }));

    const publicImages = sanitizedImages.filter((img) => img.status === 'Public');
    const privateImages = sanitizedImages.filter((img) => img.status === 'Private');

    // Dynamically generate rows of 4/5 items alternately
    let rowsHtml = '';
    let currentRow = [];
    let rowType = 'first-row'; // Start with a row of five items

    [...publicImages, ...privateImages].forEach((image, index) => {
      currentRow.push(image);

      // Alternate between rows of five and four items
      const maxItemsInRow = rowType === 'first-row' ? 5 : 4;

      if (currentRow.length === maxItemsInRow || index === [...publicImages, ...privateImages].length - 1) {
        rowsHtml += `<div class="custom-row ${rowType}">`;
        currentRow.forEach((img) => {
          rowsHtml += `
            <div class="gallery-item">
              ${img.status === 'Public' ? `
                <a href="/galleries/${slug}/${img.slug}">
                  <img src="/images/gallery/${img.icon}" alt="${img.name}" />
                  <p>${img.name}</p>
                </a>
              ` : `
                <a href="#" onclick="openModal('${img.id}')">
                  <img src="/images/gallery/${img.icon}" alt="${img.name}" />
                  <p>${img.name} (Private)</p>
                </a>
              `}
            </div>
          `;
        });
        rowsHtml += `</div>`;
        currentRow = [];
        rowType = rowType === 'first-row' ? 'second-row' : 'first-row'; // Alternate row type
      }
    });

    res.render('Pages/gallery', { gallery, galleries, rowsHtml, movingBackground2: true, 'site-footer': true });
  } catch (error) {
    console.error('[Error] Index controller:', error.message);
    res.status(500).render('error', { error: 'An unexpected error occurred.' });
  }
};


/**
 * Controller: Handle private image access with password validation.
 */
export const privateImage = async (req, res) => {
  try {
    const { gallery_slug, image_slug } = req.params;
    const { password } = req.body;

    const image = await fetchGalleryImagesBySlug(gallery_slug);

    if (!image || image.status !== 'Private') {
      return res.status(404).render('Pages/404', { error: 'Private image not found' });
    }

    const isValidPassword = await validatePassword(password);

    if (!isValidPassword) {
      return res.status(403).render('Pages/403', { error: 'Invalid password' });
    }

    res.render('Pages/private_image', { image });
  } catch (error) {
    console.error('[Error] Private Image controller:', error.message);
    res.status(500).render('Pages/404', { error });
  }
};