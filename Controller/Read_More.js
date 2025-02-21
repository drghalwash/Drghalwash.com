// Import Supabase client
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://drwismqxtzpptshsqphb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyd2lzbXF4dHpwcHRzaHNxcGhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk3MTExNTIsImV4cCI6MjA1NTI4NzE1Mn0.V8C0Fk9u9PS_rc3Kc-X_n-KzStr--m14fKYw9b1BJSI';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Fetch a single blog by slug (id in the route).
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
    
    // Fetch blogs in the same category excluding the current blog
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
 * Fetch gallery data for sidebar.
 */
const fetchGalleryData = async () => {
  try {
    console.log('[Gallery] Fetching gallery data...');
    const { data: galleryData, error } = await supabase
      .from('gallery')
      .select('*');

    if (error) throw new Error(`Error fetching gallery data: ${error.message}`);
    return galleryData;
  } catch (error) {
    console.error('[Error] Fetching gallery data:', error.message);
    throw error;
  }
};

/**
 * Read More Controller - Render Single Blog Page
 */
export const index = async (req, res) => {
  try {
    const { id: blogSlug } = req.params;

    // Fetch the main blog by slug
    const Blog = await fetchBlogBySlug(blogSlug);

    // Combine the titles and texts into a structured format for rendering
    Blog.description = Blog.read_more_titles.map((title, index) => ({
      title,
      text: Blog.read_more_texts[index]?.replace(/\n/g, '<br>') || '',
    }));

    // Increment view count for the blog
    await supabase
      .from('blogs')
      .update({ view_count: Blog.view_count + 1 })
      .eq('id', Blog.id);

    // Fetch related blogs and other required data in parallel
    const [relatedBlogs, latestBlogs, galleryData] = await Promise.all([
      fetchRelatedBlogs(Blog.category_technical_id, Blog.id),
      fetchLatestBlogs(),
      fetchGalleryData(),
    ]);

    // Render the "Read More" page with all required data
    res.render('Pages/Read_More', { Blog, randomBlogs: relatedBlogs, latestBlogs, Photo_Gallary: galleryData });
    
    console.log(`[Success] Rendered Read More page for blog slug: ${blogSlug}`);
  } catch (error) {
    console.error('[Error] Rendering Read More page:', error.message);
    
    res.status(500).render('Pages/404', { 
      error,
      errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined,
     });
  }
};

/**
 * Blog Back Controller - Render Blogs by Category
 */
export const blog_back = async (req, res) => {
  try {
    const { id: categoryTechnicalId } = req.params;

    // Fetch blogs within the specified category
    const { data: blogsInCategory, error } = await supabase
      .from('blogs')
      .select('*')
      .eq('category_technical_id', categoryTechnicalId);

    if (error) throw new Error(`Error fetching blogs in category: ${error.message}`);

    // Group blogs by category name for rendering
    const groupedBlogs = blogsInCategory.reduce((acc, currentBlog) => {
      const categoryName = currentBlog.category_technical_id || 'Uncategorized';
      
      if (!acc[categoryName]) acc[categoryName] = [];
      
      acc[categoryName].push(currentBlog);
      
      return acc;
    }, {});

    // Fetch additional required data in parallel
    const [latestBlogs, galleryData] = await Promise.all([
      fetchLatestBlogs(),
      fetchGalleryData(),
    ]);

    // Render the Blogs page with grouped data and additional metadata
    res.render('Pages/Blog', { groupedBlogs, latestBlogs, Photo_Gallary: galleryData });

    console.log(`[Success] Rendered Blogs page for category ID: ${categoryTechnicalId}`);
  } catch (error) {
    console.error('[Error] Rendering Blogs page:', error.message);
    
    res.status(500).render('Pages/404', { 
      error,
      errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined,
     });
  }
};
