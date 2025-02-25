import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://drwismqxtzpptshsqphb.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyd2lzbXF4dHpwcHRzaHNxcGhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk3MTExNTIsImV4cCI6MjA1NTI4NzE1Mn0.V8C0Fk9u9PS_rc3Kc-X_n-KzStr--m14fKYw9b1BJSI';
const supabase = createClient(supabaseUrl, supabaseKey);

export const index = async (req, res) => {
  try {
    const { slug } = req.params;
    const { data: gallery } = await supabase
      .from('gallery')
      .select('*')
      .eq('slug', slug)
      .single();

    const { data: images } = await supabase
      .from('galleryimage')
      .select('*')
      .eq('gallery_slug', slug);

    const { data: galleries } = await supabase
      .from('gallery')
      .select('*');

    if (!gallery) {
      return res.status(404).render('error', { error: 'Gallery not found' });
    }

    let rowsHtml = '';
    let rowType = 'first-row';
    let currentRowItems = [];

    images.forEach((image, index) => {
      const divClass = image.status === 'Public' ? 'custom-div' : 'custom-div-private';
      const iconSrc = `https://github.com/drghalwash/Test/blob/main/gallery/${image.icon}?raw=true`;

      const divHtml = image.status === 'Public' 
        ? `<div class="${divClass}" onclick="window.location.href='/galleries/${slug}/${image.slug}'">
            <img class="icons" src="${iconSrc}" alt="${image.name}">
            <p>${image.name}</p>
          </div>`
        : `<div class="${divClass}" data-bs-toggle="modal" data-bs-target="#passwordModal" onclick="document.getElementById('imageId').value='${image.id}'">
            <img class="icons" src="${iconSrc}" alt="${image.name}">
            <p>${image.name} <i class="fas fa-lock"></i></p>
          </div>`;

      currentRowItems.push(divHtml);

      const maxItemsInRow = rowType === 'first-row' ? 5 : 4;
      if (currentRowItems.length === maxItemsInRow || index === images.length - 1) {
        rowsHtml += `<div class="custom-row ${rowType}">${currentRowItems.join('')}</div>`;
        currentRowItems = [];
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