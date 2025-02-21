// Import Supabase client
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://drwismqxtzpptshsqphb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyd2lzbXF4dHpwcHRzaHNxcGhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk3MTExNTIsImV4cCI6MjA1NTI4NzE1Mn0.V8C0Fk9u9PS_rc3Kc-X_n-KzStr--m14fKYw9b1BJSI';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Fetch Home data.
 */
const fetchHomeData = async () => {
  try {
    console.log('[Home] Fetching home data...');
    const { data: homeData, error } = await supabase
      .from('Home')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw new Error(`Error fetching home data: ${error.message}`);
    return homeData[0]; // Return the latest home entry
  } catch (error) {
    console.error('[Error] Fetching home data:', error.message);
    throw error;
  }
};

/**
 * Fetch Offers data.
 */
const fetchOffersData = async () => {
  try {
    console.log('[Offers] Fetching offers data...');
    const { data: offersData, error } = await supabase
      .from('Offers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Error fetching offers data: ${error.message}`);
    return offersData; // Return all offers
  } catch (error) {
    console.error('[Error] Fetching offers data:', error.message);
    throw error;
  }
};

/**
 * Fetch Gallery data.
 */
const fetchGalleryData = async () => {
  try {
    console.log('[Gallery] Fetching gallery data...');
    const { data: galleryData, error } = await supabase
      .from('gallery')
      .select('*');

    if (error) throw new Error(`Error fetching gallery data: ${error.message}`);
    return galleryData; // Return all gallery items
  } catch (error) {
    console.error('[Error] Fetching gallery data:', error.message);
    throw error;
  }
};

/**
 * Home Controller - Render the homepage.
 */
export const index = async (req, res) => {
  try {
    console.log('[Request] Homepage requested');

    // Fetch all required data in parallel
    const [Home, Offers, galleries] = await Promise.all([
      fetchHomeData(),
      fetchOffersData(),
      fetchGalleryData(),
    ]);

    // Render the homepage with fetched data
    res.render('Pages/index', { Home, Offers, galleries });

    console.log('[Success] Homepage rendered successfully');
  } catch (error) {
    console.error('[Error] Rendering homepage:', error.message);

    res.status(500).render('Pages/404', {
      error,
      errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};
