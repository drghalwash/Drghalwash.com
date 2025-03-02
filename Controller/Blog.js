// Import Supabase client
import { createClient } from '@supabase/supabase-js';
import { processBatchQuestionsToBlogs } from './openRouterService.js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://drwismqxtzpptshsqphb.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyd2lzbXF4dHpwcHRzaHNxcGhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk3MTExNTIsImV4cCI6MjA1NTI4NzE1Mn0.V8C0Fk9u9PS_rc3Kc-X_n-KzStr--m14fKYw9b1BJSI';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Fetch all blogs with their tags and categories.
 */
const fetchAllBlogs = async () => {
  try {
    console.log('[Blogs] Fetching all blogs with tags and categories...');
    const { data: blogs, error } = await supabase
      .from('blogs')
      .select(`
        *,
        blog_tags(tag_id),
        tags(name),
        categories(display_name)
      `);

    if (error) throw new Error(`Error fetching blogs: ${error.message}`);
    return blogs;
  } catch (error) {
    console.error('[Error] Fetching all blogs:', error.message);
    throw error;
  }
};

/**
 * Fetch a single blog by slug.
 */
const fetchBlogBySlug = async (slug) => {
  try {
    console.log(`[Blog] Fetching blog with slug: ${slug}`);
    const { data: blog, error } = await supabase
      .from('blogs')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) throw new Error(`Error fetching blog by slug: ${error.message}`);
    return blog;
  } catch (error) {
    console.error('[Error] Fetching blog by slug:', error.message);
    throw error;
  }
};

/**
 * Fetch related blogs based on category or tags.
 */
const fetchRelatedBlogs = async (categoryTechnicalId, currentBlogId) => {
  try {
    console.log(`[Blog] Fetching related blogs for category: ${categoryTechnicalId}`);
    
    // Fetch related blogs in the same category excluding the current blog
    const { data: relatedBlogs, error } = await supabase
      .from('blogs')
      .select('*')
      .eq('category_technical_id', categoryTechnicalId)
      .neq('id', currentBlogId)
      .limit(2);

    if (error) throw new Error(`Error fetching related blogs: ${error.message}`);

    // If fewer than 2 blogs are found, fetch additional random blogs from other categories
    if (relatedBlogs.length < 2) {
      const { data: additionalBlogs, error: additionalError } = await supabase
        .from('blogs')
        .select('*')
        .neq('id', currentBlogId)
        .neq('category_technical_id', categoryTechnicalId)
        .limit(2 - relatedBlogs.length);

      if (additionalError) throw new Error(`Error fetching additional blogs: ${additionalError.message}`);

      return [...relatedBlogs, ...additionalBlogs];
    }

    return relatedBlogs;
  } catch (error) {
    console.error('[Error] Fetching related blogs:', error.message);
    throw error;
  }
};

/**
 * Fetch latest blogs for sidebar.
 */
const fetchLatestBlogs = async () => {
  try {
    console.log('[Blog] Fetching latest blogs...');
    const { data: latestBlogs, error } = await supabase
      .from('blogs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw new Error(`Error fetching latest blogs: ${error.message}`);
    return latestBlogs;
  } catch (error) {
    console.error('[Error] Fetching latest blogs:', error.message);
    throw error;
  }
};

/**
 * Fetch galleries data for sidebar.
 */
const fetchGalleries = async () => {
  try {
    console.log('[Gallery] Fetching galleries data...');
    const { data: galleries, error } = await supabase
      .from('gallery')
      .select('*');

    if (error) throw new Error(`Error fetching galleries: ${error.message}`);
    return galleries;
  } catch (error) {
    console.error('[Error] Fetching galleries:', error.message);
    throw error;
  }
};

/**
 * Fetch questions from Supabase.
 */
const fetchQuestions = async (limit = 10) => {
  try {
    console.log('[Questions] Fetching questions for blog generation...');
    
    // First try to get from the questions table
    let { data: questions, error } = await supabase
      .from('questions')
      .select('*')
      .limit(limit);
    
    if (error) {
      console.error('[Questions] Error fetching from questions table:', error.message);
      throw new Error(`Error fetching questions: ${error.message}`);
    }
    
    // If no questions are found or there's an issue with the structure, log detailed info
    if (!questions || questions.length === 0) {
      console.log('[Questions] No questions found in the questions table. Checking for alternative data sources...');
      
      // You could add alternative data sources here, such as a different table
      // For now, we'll just return an empty array
      return [];
    }
    
    console.log(`[Questions] Successfully fetched ${questions.length} questions`);
    console.log('[Questions] Sample question structure:', JSON.stringify(Object.keys(questions[0])));
    
    // Clean up the data to ensure it has the right format
    const cleanedQuestions = questions.map(q => {
      // Make sure we have all the required fields
      return {
        id: q.id || Date.now(), // Fallback to timestamp if no ID
        question: q.question || q.question_text || '',
        answer: q.answer || q.answer_text || '',
        category_display_name: q.category_display_name || 'Uncategorized',
        // Add any other fields that need to be normalized
      };
    });
    
    console.log(`[Questions] Cleaned and normalized ${cleanedQuestions.length} questions`);
    return cleanedQuestions;
  } catch (error) {
    console.error('[Error] Fetching questions:', error.message);
    console.error('[Error] Stack trace:', error.stack);
    throw error;
  }
};

/**
 * Convert questions to blogs via OpenRouter API.
 */
const convertQuestionsToBlogsAPI = async (req, res) => {
  try {
    console.log('[API] Convert questions to blogs initiated');
    
    // Authentication check if needed
    // if (!req.headers.authorization) {
    //   return res.status(401).json({ error: 'Unauthorized' });
    // }
    
    const limit = req.query.limit ? parseInt(req.query.limit) : 5;
    console.log(`[API] Fetching up to ${limit} questions`);
    
    const questions = await fetchQuestions(limit);
    console.log(`[API] Fetched ${questions ? questions.length : 0} questions`);
    
    if (!questions || questions.length === 0) {
      return res.status(200).json({ message: 'No questions found to process' });
    }
    
    // Log the structure of the first question for debugging
    if (questions.length > 0) {
      console.log('[API] First question structure:', JSON.stringify(Object.keys(questions[0])));
      console.log('[API] First question sample:', JSON.stringify({
        id: questions[0].id,
        question: questions[0].question ? questions[0].question.substring(0, 50) + '...' : 'N/A',
        answer: questions[0].answer ? questions[0].answer.substring(0, 50) + '...' : 'N/A',
        category: questions[0].category_display_name
      }));
    }
    
    // Process questions to blogs using OpenRouter
    console.log('[API] Calling processBatchQuestionsToBlogs with questions data');
    const results = await processBatchQuestionsToBlogs(questions, supabase);
    
    console.log('[API] Process completed with results:', JSON.stringify(results));
    
    res.status(200).json({
      message: 'Question to blog conversion process completed',
      stats: results
    });
  } catch (error) {
    console.error('[API Error] Converting questions to blogs:', error.message);
    console.error('[API Error] Stack trace:', error.stack);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Blog Index Controller - Render Blogs Page
 */
export const index = async (req, res) => {
  try {
    console.log('[Request] Blog index page requested');

    // Fetch all required data in parallel
    const [allBlogs, latestBlogs, galleries] = await Promise.all([
      fetchAllBlogs(),
      fetchLatestBlogs(),
      fetchGalleries(),
    ]);

    // Group blogs by category for rendering
    const groupedBlogs = allBlogs.reduce((acc, blog) => {
      const categoryName = blog.categories?.display_name || 'Uncategorized';
      
      if (!acc[categoryName]) acc[categoryName] = [];
      
      acc[categoryName].push(blog);
      
      return acc;
    }, {});

    // Render the Blogs page with grouped data and additional metadata
    res.render('Pages/Blog', { groupedBlogs, latestBlogs, galleries });

    console.log('[Success] Rendered Blogs page');
  } catch (error) {
    console.error('[Error] Rendering Blogs page:', error.message);
    
    res.status(500).render('Pages/404', { 
      error,
      errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined,
     });
  }
};

/**
 * Read More Controller - Render Single Blog Page
 */
export const readMore = async (req, res) => {
  try {
    const { slug } = req.params;

    // Fetch the main blog by slug
    const Blog = await fetchBlogBySlug(slug);

    // Combine the titles and texts into a structured format for rendering
    Blog.description = Blog.read_more_titles.map((title, index) => ({
      title,
      text: Blog.read_more_texts[index]?.replace(/\n/g, '<br>') || '',
    }));

    // Fetch related blogs and other required data in parallel
    const [relatedBlogs, latestBlogs, galleries] = await Promise.all([
      fetchRelatedBlogs(Blog.category_technical_id, Blog.id),
      fetchLatestBlogs(),
      fetchGalleries(),
    ]);

    // Render the "Read More" page with all required data
    res.render('Pages/Read_More', { Blog, randomBlogs: relatedBlogs, latestBlogs, galleries });
    
    console.log(`[Success] Rendered Read More page for blog slug: ${slug}`);
  } catch (error) {
    console.error('[Error] Rendering Read More page:', error.message);
    
    res.status(500).render('Pages/404', { 
      error,
      errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined,
     });
  }
};

export { fetchGalleries, convertQuestionsToBlogsAPI }