
import fetch from 'node-fetch';
import { createLogger } from './logUtil.js';

// Create module-specific logger
const logger = createLogger('OpenRouter');

/**
 * Service for interacting with OpenRouter API to generate blog content
 */
export const generateBlogFromQA = async (question, answer) => {
  try {
    logger.info(`Generating blog from Q&A: "${question.substring(0, 50)}..."`);
    logger.debug(`Answer length: ${answer.length} characters`);
    
    const prompt = `
Convert the following question and answer into a well-structured blog post:

QUESTION: ${question}

ANSWER: ${answer}

Please create a blog post with:
1. An engaging title
2. An introduction
3. 3-5 sections with appropriate headings
4. A conclusion
5. Format the content with appropriate HTML tags

Return the response as a JSON object with the following structure:
{
  "title": "Blog title",
  "content": "Full HTML-formatted blog content",
  "summary": "Brief summary of the blog post",
  "tags": ["tag1", "tag2", "tag3"]
}
`;

    console.log('[OpenRouter] Sending request to API...');
    
    const apiKey = process.env.OPEN_ROUTER_API_KEY || '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';
    console.log(`[OpenRouter] Using API key: ${apiKey.substring(0, 10)}...`);
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://yoursite.com',
        'X-Title': 'QA to Blog Converter'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-thinking-exp:free',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[OpenRouter] API response not OK:', JSON.stringify(errorData));
      throw new Error(`OpenRouter API error: ${JSON.stringify(errorData)}`);
    }

    console.log('[OpenRouter] API response received, status:', response.status);
    const data = await response.json();
    console.log('[OpenRouter] Successfully generated blog content');
    console.log('[OpenRouter] Response data structure:', JSON.stringify(Object.keys(data)));
    
    if (!data.choices || !data.choices.length || !data.choices[0].message) {
      console.error('[OpenRouter] Unexpected API response structure:', JSON.stringify(data));
      throw new Error('Invalid response structure from OpenRouter API');
    }
    
    console.log('[OpenRouter] Content length:', data.choices[0].message.content.length);
    
    try {
      // Parse the JSON from the AI response
      const content = data.choices[0].message.content;
      console.log('[OpenRouter] Attempting to parse JSON from response');
      const parsed = JSON.parse(content);
      console.log('[OpenRouter] Successfully parsed JSON, structure:', Object.keys(parsed).join(', '));
      return parsed;
    } catch (parseError) {
      console.error('[OpenRouter] Error parsing JSON response:', parseError);
      console.log('[OpenRouter] Raw content received:', data.choices[0].message.content);
      
      // Fallback: Create a structured response manually
      console.log('[OpenRouter] Using fallback structure');
      return {
        title: question,
        content: data.choices[0].message.content,
        summary: `Blog post about ${question}`,
        tags: ['auto-generated']
      };
    }
  } catch (error) {
    console.error('[OpenRouter] Error generating blog:', error.message);
    console.error('[OpenRouter] Error stack:', error.stack);
    throw error;
  }
};

/**
 * Process multiple questions and answers to create blog posts
 */
export const processBatchQuestionsToBlogs = async (questionsData, supabase) => {
  console.log(`[OpenRouter] Processing batch of ${questionsData.length} questions to blogs`);
  
  // Check if supabase connection is valid
  try {
    console.log('[OpenRouter] Verifying database connection...');
    const { data: healthCheck, error: healthError } = await supabase.from('blogs').select('id').limit(1);
    
    // Log the raw results for debug
    console.log('[OpenRouter] Database health check results:');
    console.log('[OpenRouter] Data:', JSON.stringify(healthCheck));
    console.log('[OpenRouter] Error:', healthError ? JSON.stringify(healthError) : 'None');
    
    if (healthError) {
      console.error('[OpenRouter] Supabase connection error:', healthError.message);
      throw new Error(`Database connection error: ${healthError.message}`);
    }
    console.log('[OpenRouter] Database connection verified successfully');
    
    // Check if blogs table exists and has expected structure
    try {
      console.log('[OpenRouter] Inspecting blogs table structure...');
      const { error: descError } = await supabase.rpc('describe_table', { table_name: 'blogs' });
      
      if (descError) {
        console.error('[OpenRouter] Error inspecting blogs table:', descError.message);
      } else {
        console.log('[OpenRouter] Blogs table structure looks valid');
      }
    } catch (structError) {
      console.warn('[OpenRouter] Table inspection failed:', structError.message);
    }
  } catch (connError) {
    console.error('[OpenRouter] Failed to verify database connection:', connError.message);
    console.error('[OpenRouter] Error stack:', connError.stack);
    throw connError;
  }
  
  if (questionsData.length === 0) {
    console.warn('[OpenRouter] Empty questions data provided, nothing to process');
    return {
      success: 0,
      failures: 0,
      errors: [],
      message: 'No questions data provided'
    };
  }
  
  console.log('[OpenRouter] Question data structure:', JSON.stringify(questionsData[0] ? Object.keys(questionsData[0]) : 'No data'));
  console.log('[OpenRouter] First question preview:', 
    questionsData[0] ? 
    `ID: ${questionsData[0].id}, Question: "${questionsData[0].question?.substring(0, 30)}...", Answer length: ${questionsData[0].answer?.length || 0}` : 
    'No question data'
  );
  
  const results = {
    success: 0,
    failures: 0,
    errors: [],
    processingDetails: []
  };
  
  // We'll try with just one question first for debugging
  const testMode = true;
  const itemsToProcess = testMode ? questionsData.slice(0, 1) : questionsData;
  
  console.log(`[OpenRouter] Processing ${itemsToProcess.length} items in ${testMode ? 'TEST' : 'FULL'} mode`);
  
  for (const item of itemsToProcess) {
    try {
      console.log(`[OpenRouter] Processing question ID ${item.id}`);
      
      // Skip if this question has already been processed
      console.log(`[OpenRouter] Checking if question ${item.id} has already been processed...`);
      const { data: existingBlogs, error: existingError } = await supabase
        .from('blogs')
        .select('id')
        .eq('source_question_id', item.id);
      
      console.log(`[OpenRouter] Existing blogs check:`, JSON.stringify(existingBlogs));
      console.log(`[OpenRouter] Existing blogs error:`, existingError ? JSON.stringify(existingError) : 'None');
        
      if (existingBlogs && existingBlogs.length > 0) {
        console.log(`[OpenRouter] Skipping question ID ${item.id} - already processed`);
        continue;
      }
      
      // Check if required fields exist
      if (!item.question && !item.question_text) {
        throw new Error('Question text is missing');
      }
      
      if (!item.answer && !item.answer_text) {
        throw new Error('Answer text is missing');
      }
      
      const questionText = item.question_text || item.question;
      const answerText = item.answer_text || item.answer;
      
      console.log(`[OpenRouter] Generating blog for question: "${questionText.substring(0, 50)}..."`);
      
      const blogData = await generateBlogFromQA(questionText, answerText);
      
      // Generate a slug from the title
      const slug = blogData.title
        .toLowerCase()
        .replace(/[^\w\s]/gi, '')
        .replace(/\s+/g, '-');
      
      console.log(`[OpenRouter] Generated slug: ${slug}`);
      
      // Extract sections from the content
      const sections = extractSectionsFromContent(blogData.content);
      console.log(`[OpenRouter] Extracted ${sections.titles.length} sections`);
      
      // Prepare the data for insertion
      const blogInsertData = {
        title: blogData.title,
        summary: blogData.summary ? blogData.summary.substring(0, 500) : `Blog post about ${questionText}`.substring(0, 500),
        content: blogData.content,
        slug: slug,
        read_more_titles: sections.titles || [],
        read_more_texts: sections.texts || [],
        category_display_name: item.category_display_name || 'Uncategorized',
        tags: blogData.tags || ['auto-generated'],
        image_url: 'default-blog-image.jpg',
        source_question_id: item.id,
        created_at: new Date().toISOString()
      };
      
      console.log(`[OpenRouter] Attempting to insert blog into database`);
      console.log(`[OpenRouter] Blog data structure:`, JSON.stringify(Object.keys(blogInsertData)));
      
      const { data, error } = await supabase
        .from('blogs')
        .insert(blogInsertData);
        
      if (error) {
        console.error(`[OpenRouter] Database error:`, error);
        throw new Error(`Error inserting blog: ${error.message}`);
      }
      
      console.log(`[OpenRouter] Successfully created blog from question ID ${item.id}`);
      results.success++;
    } catch (error) {
      console.error(`[OpenRouter] Failed to process question ID ${item.id || 'unknown'}:`, error.message);
      console.error(`[OpenRouter] Error stack:`, error.stack);
      results.failures++;
      results.errors.push({
        question_id: item.id || 'unknown',
        error: error.message
      });
    }
  }
  
  console.log(`[OpenRouter] Batch processing complete - Success: ${results.success}, Failures: ${results.failures}`);
  if (results.errors.length > 0) {
    console.log(`[OpenRouter] Errors encountered:`, JSON.stringify(results.errors));
  }
  
  return results;
};

/**
 * Extract sections from HTML content to populate read_more_titles and read_more_texts
 */
const extractSectionsFromContent = (content) => {
  try {
    console.log(`[OpenRouter] Extracting sections from content (length: ${content.length})`);
    
    // Basic regex to find h2, h3 tags and content sections
    const headingRegex = /<h[23][^>]*>(.*?)<\/h[23]>/gi;
    const titles = [];
    let texts = [];
    let lastIndex = 0;
    let match;
    
    // Extract all headings
    while ((match = headingRegex.exec(content)) !== null) {
      titles.push(match[1].trim());
      
      if (titles.length > 1) {
        // Extract content between previous heading and this one
        const prevMatchEndIndex = lastIndex;
        const section = content.substring(prevMatchEndIndex, match.index).trim();
        texts.push(section);
      }
      
      lastIndex = match.index + match[0].length;
    }
    
    // Get the final section after the last heading
    if (lastIndex < content.length) {
      texts.push(content.substring(lastIndex).trim());
    }
    
    // If no sections were found, create a default one
    if (titles.length === 0) {
      console.log(`[OpenRouter] No headings found in content, creating default section`);
      titles.push('About This Topic');
      texts.push(content);
    }
    
    console.log(`[OpenRouter] Extracted ${titles.length} titles and ${texts.length} text sections`);
    return { titles, texts };
  } catch (error) {
    console.error('[OpenRouter] Error extracting sections:', error.message);
    console.error('[OpenRouter] Error stack:', error.stack);
    return { 
      titles: ['Introduction', 'Details', 'Conclusion'],
      texts: [content, '', '']
    };
  }
};
