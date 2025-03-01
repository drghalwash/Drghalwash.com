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
            (question) => question.category_display_name === category.display_name
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
    const searchTerm = req.query.search || '';
    console.log('[Controller] Search term:', searchTerm);

    // Fetch galleries and hierarchical zone data concurrently
    const [galleries, organizedZones] = await Promise.all([
      getGalleries(),
      getZonesWithDetails(),
    ]);

    // Process data based on search term if provided
    let filteredZones = organizedZones;
    let hasResults = true;
    let searchTerm = req.query.search || '';
    searchTerm = searchTerm.trim().toLowerCase();
    
    if (searchTerm) {
      console.log(`[Search] Processing search for term: "${searchTerm}"`);
      
      // Filter questions that match the search term
      filteredZones = organizedZones.map(zone => {
        return {
          ...zone,
          categories: zone.categories.map(category => {
            return {
              ...category,
              questions: category.questions.filter(question => {
                // Search in question text, title, and answer content
                const questionText = (question.question_text || question.question || '').toLowerCase();
                const answer = (question.answer || '').toLowerCase();
                
                return (
                  questionText.includes(searchTerm) ||
                  answer.includes(searchTerm)
                );
              }),
              // Mark if this category has any matching questions
              hasMatches: category.questions.some(question => {
                const questionText = (question.question_text || question.question || '').toLowerCase();
                const answer = (question.answer || '').toLowerCase();
                
                return (
                  questionText.includes(searchTerm) ||
                  answer.includes(searchTerm)
                );
              })
            };
          }).filter(category => category.questions.length > 0), // Remove empty categories
          // Mark if this zone has any matching questions
          hasAnyMatches: zone.categories.some(category => 
            category.questions.some(question => {
              const questionText = (question.question_text || question.question || '').toLowerCase();
              const answer = (question.answer || '').toLowerCase();
              
              return (
                questionText.includes(searchTerm) ||
                answer.includes(searchTerm)
              );
            })
          )
        };
      }).filter(zone => zone.categories.length > 0); // Remove empty zones
      
      // Calculate total results for UI display
      const totalResults = filteredZones.reduce((total, zone) => 
        total + zone.categories.reduce((catTotal, category) => 
          catTotal + category.questions.length, 0), 0);
          
      hasResults = totalResults > 0;
      
      console.log(`[Search] Found ${totalResults} results for "${searchTerm}"`);
    }

    // Render the Handlebars template with fetched and processed data
    res.render('Pages/Questions_And_Answer', {
      galleries,
      zones: filteredZones,
      searchTerm,
      hasSearch: !!searchTerm,
      hasResults,
      searchCount: filteredZones.reduce((total, zone) => 
        total + zone.categories.reduce((catTotal, category) => 
          catTotal + category.questions.length, 0), 0)
    });

    console.log('[Controller] Data successfully sent to the template.');
  } catch (error) {
    console.error('[Controller] Error in Q&A controller:', error.message);
    res.status(500).render('Pages/404', { error });
  }
};
