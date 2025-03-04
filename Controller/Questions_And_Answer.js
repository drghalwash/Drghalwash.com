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

    // Intelligent text formatting system
    const formatAnswerText = (text) => {
      if (!text) return '';
      
      // Apply 10 verified formatting patterns
      let formattedText = text;
      
      // 1. Medical terminology highlighting (specialty terms)
    
      
      // 2. Important terms emphasis (for quoted terms)
      formattedText = formattedText.replace(/"([^"]+)"/g, '<span class="important-term">$1</span>');
      
      // 3. Statistics & percentages highlight
      formattedText = formattedText.replace(/(\d+(?:\.\d+)?%|\d+(?:\.\d+)?\s*percent)/gi, '<span class="marked">$1</span>');
      
      // 4. Bullet point detection and formatting
      if (formattedText.match(/^[\s]*[-*•][\s]+.+$/gm)) {
        const lines = formattedText.split('\n');
        let inList = false;
        let listContent = '';
        
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].match(/^[\s]*[-*•][\s]+/)) {
            if (!inList) {
              listContent += '<ul>';
              inList = true;
            }
            const content = lines[i].replace(/^[\s]*[-*•][\s]+/, '');
            listContent += `<li>${content}</li>`;
            lines[i] = ''; // Clear the line as it's now in the list
          } else if (inList && lines[i].trim() !== '') {
            listContent += '</ul>';
            inList = false;
            listContent += lines[i];
            lines[i] = '';
          } else if (lines[i].trim() !== '') {
            listContent += lines[i];
            lines[i] = '';
          }
        }
        
        if (inList) {
          listContent += '</ul>';
        }
        
        formattedText = listContent;
      }
      
      // 5. Warning/caution highlighting
      formattedText = formattedText.replace(/(warning|caution|important|note)[:!]\s*([^.!?]+[.!?])/gi, 
                                    '<span class="alert-highlight">$1: $2</span>');
      
      // 6. Time periods & measurements formatting
      formattedText = formattedText.replace(/\b(\d+(?:\.\d+)?)\s*(days?|weeks?|months?|years?|hours?|cm|mm)\b/gi, 
                                     '<span class="color-system">$1 $2</span>');
      
      // 7. Section heading detection
      formattedText = formattedText.replace(/^([A-Za-z][^:]+):\s*$/gm, '<h4>$1</h4>');
      
      // 8. Proper paragraph structure
      if (!formattedText.includes('<p>')) {
        formattedText = formattedText.replace(/\n\n+/g, '</p><p>');
        formattedText = `<p>${formattedText}</p>`;
      }
      
      // 9. ALL CAPS emphasis
      formattedText = formattedText.replace(/\b([A-Z]{2,})\b/g, '<span class="accessibility-bold">$1</span>');
      
      // 10. Procedure/category highlighting
      const procedures = [
        'Breast Augmentation', 'Rhinoplasty', 'Liposuction', 'Facelift', 'Tummy Tuck',
        'Breast Lift', 'Body Contouring', 'Botox', 'Fillers', 'Plastic Surgery'
      ];
      const procedureRegex = new RegExp(`\\b(${procedures.join('|')})\\b`, 'g');
      formattedText = formattedText.replace(procedureRegex, '<span class="category-highlight">$1</span>');
      
      return formattedText;
    };

    // Organize data hierarchically with text formatting applied
    const organizedZones = zones.map((zone) => ({
      ...zone,
      categories: categories
        .filter((category) => category.zone_id === zone.id)
        .map((category) => ({
          ...category,
          questions: questions
            .filter((question) => question.category_display_name === category.display_name)
            .map((question) => ({
              ...question,
              answer: formatAnswerText(question.answer) // Apply formatting to each answer
            })),
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
