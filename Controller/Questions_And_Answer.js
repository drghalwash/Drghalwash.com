// Import Supabase client
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://drwismqxtzpptshsqphb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyd2lzbXF4dHpwcHRzaHNxcGhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk3MTExNTIsImV4cCI6MjA1NTI4NzE1Mn0.V8C0Fk9u9PS_rc3Kc-X_n-KzStr--m14fKYw9b1BJSI';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Fetch all zones with their nested categories and questions.
 */
const getZonesWithDetails = async () => {
  try {
    console.log('[Zones] Fetching zones...');
    const { data: zones, error: zonesError } = await supabase.from('zones').select('*');
    if (zonesError) throw new Error(`[Zones] Error fetching zones: ${zonesError.message}`);
    console.log('[Zones] Zones fetched:', zones);

    console.log('[Categories] Fetching categories...');
    const { data: categories, error: categoriesError } = await supabase.from('categories').select('*');
    if (categoriesError) throw new Error(`[Categories] Error fetching categories: ${categoriesError.message}`);
    console.log('[Categories] Categories fetched:', categories);

    console.log('[Questions] Fetching questions...');
    const { data: questions, error: questionsError } = await supabase.from('questions').select('*');
    if (questionsError) throw new Error(`[Questions] Error fetching questions: ${questionsError.message}`);
    console.log('[Questions] Questions fetched:', questions);

    // Organize data hierarchically
    const organizedZones = zones.map((zone) => ({
      ...zone,
      categories: categories
        .filter((category) => category.zone_id === zone.id)
        .map((category) => ({
          ...category,
          questions: questions.filter(
            (question) => question.category_technical_id === category.technical_id
          ),
        })),
    }));

    console.log('[Zones] Organized Zones:', JSON.stringify(organizedZones, null, 2));
    return organizedZones;
  } catch (error) {
    console.error('[Zones] Error organizing zones:', error.message);
    throw error;
  }
};

/**
 * Fetch all galleries from Supabase.
 */
const getGalleries = async () => {
  try {
    console.log('[Gallery] Fetching galleries from Supabase...');
    const { data: galleries, error } = await supabase.from('gallery').select('*'); // CHANGED: Photo_Gallary to gallery
    if (error) throw new Error(`[Gallery] Error fetching galleries: ${error.message}`);
    console.log('[Gallery] Galleries fetched:', galleries);
    return galleries;
  } catch (error) {
    console.error('[Gallery] Error fetching galleries:', error.message);
    throw error;
  }
};

/**
 * Q&A Controller
 */
export const index = async (req, res) => {
  try {
    console.log('[Controller] Q&A Index initiated...');

    // Fetch galleries and hierarchical zone data concurrently
    const [galleries, organizedZones] = await Promise.all([
      getGalleries(), // CHANGED: Photo_Gallary to gallery
      getZonesWithDetails(),
    ]);

    // Render the Handlebars template with fetched data
    res.render('Pages/Questions_And_Answer', {
      galleries, // CHANGED: Photo_Gallary to galleries
      zones: organizedZones,
    });

    console.log('[Controller] Data successfully sent to the template.');
  } catch (error) {
    console.error('[Controller] Error in Q&A controller:', error.message);
    res.status(500).render('Pages/404', { error });
  }
};
