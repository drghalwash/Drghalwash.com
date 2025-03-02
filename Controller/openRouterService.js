
import fetch from 'node-fetch';

/**
 * Service for interacting with OpenRouter API to generate blog content
 */
export const generateBlogFromQA = async (question, answer) => {
  try {
    console.log(`[OpenRouter] Generating blog from Q&A: "${question}"`);
    
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

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPEN_ROUTER_API_KEY || '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'}`,
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
      throw new Error(`OpenRouter API error: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log('[OpenRouter] Successfully generated blog content');
    
    try {
      // Parse the JSON from the AI response
      const content = data.choices[0].message.content;
      return JSON.parse(content);
    } catch (parseError) {
      console.error('[OpenRouter] Error parsing JSON response:', parseError);
      
      // Fallback: Create a structured response manually
      return {
        title: question,
        content: data.choices[0].message.content,
        summary: `Blog post about ${question}`,
        tags: ['auto-generated']
      };
    }
  } catch (error) {
    console.error('[OpenRouter] Error generating blog:', error.message);
    throw error;
  }
};

/**
 * Process multiple questions and answers to create blog posts
 */
export const processBatchQuestionsToBlogs = async (questionsData, supabase) => {
  console.log(`[OpenRouter] Processing batch of ${questionsData.length} questions to blogs`);
  
  const results = {
    success: 0,
    failures: 0,
    errors: []
  };
  
  for (const item of questionsData) {
    try {
      // Skip if this question has already been processed
      const { data: existingBlogs } = await supabase
        .from('blogs')
        .select('id')
        .eq('source_question_id', item.id);
        
      if (existingBlogs && existingBlogs.length > 0) {
        console.log(`[OpenRouter] Skipping question ID ${item.id} - already processed`);
        continue;
      }
      
      const blogData = await generateBlogFromQA(
        item.question_text || item.question, 
        item.answer_text || item.answer
      );
      
      // Generate a slug from the title
      const slug = blogData.title
        .toLowerCase()
        .replace(/[^\w\s]/gi, '')
        .replace(/\s+/g, '-');
      
      // Extract sections from the content
      const sections = extractSectionsFromContent(blogData.content);
      
      const { data, error } = await supabase
        .from('blogs')
        .insert({
          title: blogData.title,
          summary: blogData.summary.substring(0, 500),
          content: blogData.content,
          slug: slug,
          read_more_titles: sections.titles || [],
          read_more_texts: sections.texts || [],
          category_technical_id: 1, // Default category - adjust as needed
          tags: blogData.tags,
          image_url: 'default-blog-image.jpg', // Default image - adjust as needed
          source_question_id: item.id,
          created_at: new Date().toISOString()
        });
        
      if (error) throw new Error(`Error inserting blog: ${error.message}`);
      
      console.log(`[OpenRouter] Successfully created blog from question ID ${item.id}`);
      results.success++;
    } catch (error) {
      console.error(`[OpenRouter] Failed to process question ID ${item.id}:`, error.message);
      results.failures++;
      results.errors.push({
        question_id: item.id,
        error: error.message
      });
    }
  }
  
  return results;
};

/**
 * Extract sections from HTML content to populate read_more_titles and read_more_texts
 */
const extractSectionsFromContent = (content) => {
  try {
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
      titles.push('About This Topic');
      texts.push(content);
    }
    
    return { titles, texts };
  } catch (error) {
    console.error('[Error] Extracting sections:', error.message);
    return { 
      titles: ['Introduction', 'Details', 'Conclusion'],
      texts: [content, '', '']
    };
  }
};
