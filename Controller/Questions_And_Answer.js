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

    // Enhanced text formatting system - targets at least 35% of text for styling
    const formatAnswerText = (text) => {
      if (!text) return '';

      // Apply validated formatting patterns to maintain 35% coverage while ensuring stability
      let formattedText = text;

      try {
        // Pre-process: Fix any existing broken HTML patterns before adding new ones
        // Handle existing specialtext tags (convert them to our new format)
        formattedText = formattedText.replace(/<(\/?)specialtext>/gi, '<$1span class="special-text">');
        formattedText = formattedText.replace(/<(\/?)important-term>/gi, '<$1span class="important-term">');
        
        // Handle any malformed opening/closing tags
        formattedText = formattedText.replace(/<specialtext([^>]*)>/gi, '<span class="special-text"$1>');
        formattedText = formattedText.replace(/<important-term([^>]*)>/gi, '<span class="important-term"$1>');
        
        // Fix unopened/unclosed tags
        const openSpecialTextCount = (formattedText.match(/<span class="special-text"/g) || []).length;
        const closeSpecialTextCount = (formattedText.match(/<\/span>/g) || []).length;
        
        if (openSpecialTextCount > closeSpecialTextCount) {
          // Add missing closing tags
          const missingClosingTags = openSpecialTextCount - closeSpecialTextCount;
          for (let i = 0; i < missingClosingTags; i++) {
            formattedText += '</span>';
          }
        }

        // SMAS cleanup - fix the specific term that's causing issues
        formattedText = formattedText.replace(/SMAS(?!\w)/g, '<span class="special-text">SMAS</span>');
        
        // 1. Medical terminology highlighting with safer replacement approach
        const medicalTerms = /\b(surgery|surgical|procedure|incision|recovery|post-op|pre-op|anesthesia|healing|swelling|bruising|drainage|infection|consultation|operation|pain|medication|complication|side effect|discomfort|result|scar|tissue|outcome|treatment|doctor|surgeon|specialist|clinic|hospital|appointment|health|patient|care|examination|risk|benefit|technique|method|approach|option|alternative|solution|problem|concern|improvement|enhancement|qualified|experienced|skin|face|body|breast|abdomen|thigh|arm|neck|chin|eye|nose|lip)\b/gi;
        
        // Only apply to text not already inside a span tag
        formattedText = formattedText.replace(/([^>]+)(?=<|$)/g, function(match) {
          return match.replace(medicalTerms, '<span class="special-text">$1</span>');
        });

        // 2. Important terms emphasis (quoted terms and key phrases)
        formattedText = formattedText.replace(/([^>]+)(?=<|$)/g, function(match) {
          return match.replace(/"([^"]+)"/g, '<span class="important-term">$1</span>');
        });

        // Key phrases emphasis with safer regex
        const keyPhrases = /\b(most importantly|key point|essential|crucial|significant|recommended|advised|suggested|best practice|optimal|ideal|common concern|important|note|remember|consider|expect|typically|usually|generally|often|always|never|ensure|guarantee|priority|focus|attention|safety|comfort|satisfaction|success|excellent|quality|value|experience|expertise|knowledge|skill)\b/gi;
        
        formattedText = formattedText.replace(/([^>]+)(?=<|$)/g, function(match) {
          return match.replace(keyPhrases, '<span class="important-term">$1</span>');
        });

        // 3. Statistics & percentages highlight
        formattedText = formattedText.replace(/([^>]+)(?=<|$)/g, function(match) {
          return match.replace(/(\d+(?:\.\d+)?%|\d+(?:\.\d+)?\s*percent|\d+\s*out of\s*\d+)/gi, '<span class="marked">$1</span>');
        });

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

        // 5. Warning/caution highlighting with safer pattern
        formattedText = formattedText.replace(/([^>]+)(?=<|$)/g, function(match) {
          return match.replace(/(warning|caution|important|note|attention|remember|alert)[:!]?\s*([^.!?]+[.!?])/gi, 
                                      '<span class="alert-highlight">$1: $2</span>');
        });

        // 6. Time periods & measurements with safer pattern
        formattedText = formattedText.replace(/([^>]+)(?=<|$)/g, function(match) {
          return match.replace(/\b(\d+(?:\.\d+)?)\s*(days?|weeks?|months?|years?|hours?|minutes?|cm|mm|inches?|pounds?|kg)\b/gi, 
                                       '<span class="color-system">$1 $2</span>');
        });

        // 7. Section heading detection with safer pattern
        formattedText = formattedText.replace(/^([A-Za-z][^:]+)[:]\s*$/gm, '<h4>$1</h4>');
        formattedText = formattedText.replace(/^([A-Za-z][^\.]+)\.\s*$/gm, '<h4>$1.</h4>');

        // 8. Proper paragraph structure
        if (!formattedText.includes('<p>')) {
          formattedText = formattedText.replace(/\n\n+/g, '</p><p>');
          formattedText = `<p>${formattedText}</p>`;
        }

        // 9. ALL CAPS emphasis with safer pattern
        formattedText = formattedText.replace(/([^>]+)(?=<|$)/g, function(match) {
          return match.replace(/\b([A-Z]{2,})\b/g, '<span class="accessibility-bold">$1</span>');
        });

        // Add first sentence emphasis with safer approach
        formattedText = formattedText.replace(/<p>([^.!?]+[.!?])/g, function(match, p1) {
          if (p1.includes('<span')) return match;
          return `<p><span class="first-sentence">${p1}</span>`;
        });

        // 10. Procedure/category highlighting with safer approach
        const procedures = [
          'Breast Augmentation', 'Rhinoplasty', 'Liposuction', 'Facelift', 'Tummy Tuck',
          'Breast Lift', 'Body Contouring', 'Botox', 'Fillers', 'Plastic Surgery',
          'Mommy Makeover', 'Blepharoplasty', 'Abdominoplasty', 'Facial Rejuvenation',
          'Breast Reduction', 'Body Lift', 'Arm Lift', 'Thigh Lift', 'Neck Lift'
        ];
        
        for (const procedure of procedures) {
          const safeRegex = new RegExp(`\\b${procedure}\\b`, 'g');
          formattedText = formattedText.replace(/([^>]+)(?=<|$)/g, function(match) {
            return match.replace(safeRegex, `<span class="category-highlight">${procedure}</span>`);
          });
        }

        // Benefits highlighting with safer approach
        const benefitTerms = /\b(benefit|advantage|improvement|enhancement|satisfaction|result)\b/gi;
        formattedText = formattedText.replace(/([^>]+)(?=<|$)/g, function(match) {
          return match.replace(benefitTerms, '<span class="benefit-highlight">$1</span>');
        });
        
        // Final cleanup: fix any double-nested spans
        formattedText = formattedText.replace(/<span class="[^"]+">(.*?)<span class="([^"]+)">(.*?)<\/span>(.*?)<\/span>/g, 
                                           function(match, prefix, className, content, suffix) {
          return `<span class="${className}">${prefix}${content}${suffix}</span>`;
        });
        
        // Ensure all tags are properly closed
        const parser = new DOMParser();
        const doc = parser.parseFromString(formattedText, 'text/html');
        if (doc.body) {
          formattedText = doc.body.innerHTML;
        }
      } catch (error) {
        console.error('[Format] Error during text formatting:', error);
        // Return original text if formatting fails
        return text;
      }

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