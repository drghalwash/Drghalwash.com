// Import Supabase client
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = 'https://drwismqxtzpptshsqphb.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;
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
 * Blog Index Controller - Render Blogs Page
 */
export const index = async (req, res) => {
    try {
        console.log('[BlogController] Fetching data for blog page');

        // Fetch all required data in parallel for better performance
        const [galleryResponse, zonesResponse, blogsResponse, categoriesResponse] = await Promise.all([
            supabase.from('gallery').select('*'),
            supabase.from('blog_zones').select('*'),
            supabase.from('blogs').select('*'),
            supabase.from('categories').select('*')
        ]);

        // Check for errors in responses and provide empty arrays as fallbacks
        const galleries = galleryResponse.error ? (console.error(`Gallery fetch error: ${galleryResponse.error.message}`), []) : galleryResponse.data || [];
        const zones = zonesResponse.error ? (console.error(`Zones fetch error: ${zonesResponse.error.message}`), []) : zonesResponse.data || [];
        const blogs = blogsResponse.error ? (console.error(`Blogs fetch error: ${blogsResponse.error.message}`), []) : blogsResponse.data || [];
        const categories = categoriesResponse.error ? (console.error(`Categories fetch error: ${categoriesResponse.error.message}`), []) : categoriesResponse.data || [];

        console.log(`[BlogController] Fetched ${galleries.length} galleries, ${zones.length} zones, ${blogs.length} blogs, ${categories.length} categories`);

        // Group blogs by zones with validation and fallbacks
        const groupedBlogs = {};
        const zoneDataForNav = [];

        // If we have zones but no blogs, create placeholder categories
        if (zones.length > 0 && blogs.length === 0) {
            console.log('[BlogController] No blogs found, adding placeholder categories');
            zones.forEach(zone => {
                if (zone && zone.name) {
                    groupedBlogs[zone.name] = []; // Empty array to maintain structure
                    zoneDataForNav.push({
                        id: zone.id,
                        name: zone.name
                    });
                }
            });
        } 
        // If no zones but blogs exist, create an "Uncategorized" group
        else if (zones.length === 0 && blogs.length > 0) {
            console.log('[BlogController] No zones found, adding all blogs to Uncategorized');
            groupedBlogs['Uncategorized'] = blogs;
        }
        // Normal case: zones and blogs both exist
        else {
            zones.forEach(zone => {
                if (!zone || !zone.name || !zone.id) return;

                const blogsInZone = blogs.filter(blog => blog && blog.zone_id === zone.id);
                // Add zone data for navigation
                zoneDataForNav.push({
                    id: zone.id,
                    name: zone.name
                });
                // Add blogs to grouped object
                if (blogsInZone.length > 0) {
                    // Add zone_id to each blog for category filtering
                    const enrichedBlogs = blogsInZone.map(blog => ({
                        ...blog,
                        zone_name: zone.name
                    }));
                    groupedBlogs[zone.name] = enrichedBlogs;
                }
                console.log(`[BlogController] Zone "${zone.name}" has ${blogsInZone.length} blogs`);
            });

            // Add any blogs that don't have a zone to 'Uncategorized'
            const uncategorizedBlogs = blogs.filter(blog => blog && (!blog.zone_id || !zones.some(zone => zone.id === blog.zone_id)));
            if (uncategorizedBlogs.length > 0) {
                groupedBlogs['Uncategorized'] = uncategorizedBlogs;
                console.log(`[BlogController] "Uncategorized" has ${uncategorizedBlogs.length} blogs`);
            }
        }

        // Ensure at least one category exists for layout purposes
        if (Object.keys(groupedBlogs).length === 0) {
            console.log('[BlogController] No categories found, adding default category');
            groupedBlogs['Latest Articles'] = [];
        }

        // Get latest blogs for the sidebar with validation to avoid date parsing errors
        let latestBlogs = [];
        if (blogs.length > 0) {
            latestBlogs = [...blogs]
                .filter(blog => blog && blog.created_at)
                .sort((a, b) => {
                    try {
                        return new Date(b.created_at) - new Date(a.created_at);
                    } catch (e) {
                        console.error(`[BlogController] Date parsing error: ${e.message}`);
                        return 0;
                    }
                })
                .slice(0, 5);
        }

        console.log(`[BlogController] Prepared ${latestBlogs.length} latest blogs for sidebar`);

        // Add helper for JSON stringification in handlebars
        const hbsHelpers = {
            json: function(context) {
                return JSON.stringify(context);
            }
        };

        console.log('[BlogController] Rendering blog page');
        const isEmpty = Object.keys(groupedBlogs).length === 0;
        res.render('Pages/Blog', { 
            galleries, 
            groupedBlogs,
            latestBlogs,
            zoneData: zoneDataForNav,
            isEmpty: isEmpty,
            pageTitle: 'Blog',
            searchEnabled: true,
            helpers: hbsHelpers
        });
    } catch (error) {
        console.error('[BlogController] Error rendering blog page:', error);
        res.status(500).render("Pages/404", { 
            error,
            errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
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

export { fetchGalleries }