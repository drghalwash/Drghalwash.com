import { Router } from 'express';
import { index, convertQuestionsToBlogsAPI } from '../Controller/Blog.js';
import { createLogger, inspectDatabaseTable } from '../Controller/logUtil.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const logger = createLogger('BlogRoute');
const router = new Router();
router.get('/', index);
router.get('/api/generate-from-qa', convertQuestionsToBlogsAPI);

// Set up Supabase client for diagnostic routes
const supabaseUrl = process.env.SUPABASE_URL || 'https://drwismqxtzpptshsqphb.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyd2lzbXF4dHpwcHRzaHNxcGhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk3MTExNTIsImV4cCI6MjA1NTI4NzE1Mn0.V8C0Fk9u9PS_rc3Kc-X_n-KzStr--m14fKYw9b1BJSI';
const supabase = createClient(supabaseUrl, supabaseKey);

// Diagnostic endpoint to check database tables
router.get('/api/check-database', async (req, res) => {
  try {
    logger.info('Running database diagnostics');

    // Check blogs table
    const blogsResult = await inspectDatabaseTable(supabase, 'blogs');

    // Check questions tables
    const questionsResult = await inspectDatabaseTable(supabase, 'questions');
    const questionsRowsResult = await inspectDatabaseTable(supabase, 'questions_rows');

    // List available tables
    const { data: tablesList, error: tablesError } = await supabase
      .from('pg_catalog.pg_tables')
      .select('tablename')
      .eq('schemaname', 'public');

    let availableTables = [];
    if (!tablesError && tablesList) {
      availableTables = tablesList.map(t => t.tablename);
      logger.info(`Available tables: ${availableTables.join(', ')}`);
    } else if (tablesError) {
      logger.error('Error fetching tables list', tablesError);
    }

    res.status(200).json({
      blogs: blogsResult,
      questions: questionsResult,
      questions_rows: questionsRowsResult,
      available_tables: availableTables,
      supabase_connection: {
        url: supabaseUrl,
        key_prefix: supabaseKey.substring(0, 10) + '...'
      }
    });
  } catch (error) {
    logger.error('Database diagnostics failed', { message: error.message, stack: error.stack });
    res.status(500).json({ error: error.message });
  }
});

// Add a manual data insertion endpoint for testing
router.get('/api/create-test-blog', async (req, res) => {
  try {
    logger.info('Creating test blog entry');

    const testBlog = {
      title: 'Test Blog Entry',
      summary: 'This is a test blog created to verify database connectivity',
      content: '<h1>Test Blog</h1><p>This is test content to verify that blog insertion is working correctly.</p>',
      slug: 'test-blog-' + Date.now(),
      read_more_titles: ['Introduction', 'Testing Process', 'Conclusion'],
      read_more_texts: ['This is the introduction.', 'This is the testing process.', 'This is the conclusion.'],
      category_display_name: 'Test',
      tags: ['test', 'verification'],
      image_url: 'default-blog-image.jpg',
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('blogs')
      .insert(testBlog);

    if (error) {
      logger.error('Failed to insert test blog', { error });
      return res.status(500).json({ error: error.message });
    }

    logger.info('Successfully created test blog');

    // Check blogs table again
    const blogsResult = await inspectDatabaseTable(supabase, 'blogs');

    res.status(200).json({
      success: true,
      message: 'Test blog created successfully',
      blogs_count: blogsResult?.count || 0
    });
  } catch (error) {
    logger.error('Test blog creation failed', { message: error.message, stack: error.stack });
    res.status(500).json({ error: error.message });
  }
});

router.get('/api/test-generate-from-csv', async (req, res) => {
  try {
    logger.info('Manually generating blogs from CSV data');

    // Read the test data from the CSV file
    const fs = require('fs');
    const path = require('path');
    const csvPath = path.join(process.cwd(), 'attached_assets', 'questions_rows-1.csv');

    // Check if file exists
    if (!fs.existsSync(csvPath)) {
      return res.status(404).json({ error: 'CSV file not found' });
    }

    console.log('[TEST] Reading CSV file from:', csvPath);
    const csvData = fs.readFileSync(csvPath, 'utf8');
    const lines = csvData.split('\n').filter(line => line.trim());

    // Parse CSV (simple parser for this test)
    const headers = lines[0].split(',');
    const questions = [];

    for (let i = 1; i < lines.length; i++) {
      // Split by comma but respect quoted values
      const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
      const row = [];
      let matches;

      while ((matches = regex.exec(lines[i])) !== null) {
        if (matches[1]) {
          const value = matches[1].startsWith('"') && matches[1].endsWith('"') ? 
            matches[1].slice(1, -1).replace(/""/g, '"') : 
            matches[1];
          row.push(value);
        }
      }

      // Create object from headers and values
      const obj = {};
      headers.forEach((header, index) => {
        if (index < row.length) {
          obj[header] = row[index];
        }
      });

      questions.push(obj);
    }

    console.log(`[TEST] Parsed ${questions.length} questions from CSV`);
    console.log('[TEST] First question structure:', JSON.stringify(Object.keys(questions[0])));

    // Process a limited number of questions
    const limit = req.query.limit ? parseInt(req.query.limit) : 2;
    const limitedQuestions = questions.slice(0, limit);

    logger.info(`Processing ${limitedQuestions.length} questions to blogs`); //Added Logging

    // Import the necessary functions
    const { processBatchQuestionsToBlogs } = await import('../Controller/openRouterService.js');
    const { createClient } = await import('@supabase/supabase-js');

    // Set up Supabase client
    const supabaseUrl = process.env.SUPABASE_URL || 'https://drwismqxtzpptshsqphb.supabase.co';
    const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyd2lzbXF4dHpwcHRzaHNxcGhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk3MTExNTIsImV4cCI6MjA1NTI4NzE1Mn0.V8C0Fk9u9PS_rc3Kc-X_n-KzStr--m14fKYw9b1BJSI';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Process questions to blogs
    const results = await processBatchQuestionsToBlogs(limitedQuestions, supabase);
    logger.info(`OpenRouter processing completed with results: ${JSON.stringify(results)}`); //Added Logging

    res.status(200).json({
      message: 'Test conversion from CSV completed',
      stats: results
    });
  } catch (error) {
    console.error('[TEST Error]:', error.message);
    console.error('[TEST Error] Stack:', error.stack);
    res.status(500).json({ error: error.message });
  }
});


export default router;