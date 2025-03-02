import { Router } from 'express';
import { index, convertQuestionsToBlogsAPI } from '../Controller/Blog.js';
const router = new Router();
router.get('/', index);
router.get('/api/generate-from-qa', convertQuestionsToBlogsAPI);

router.get('/api/test-generate-from-csv', async (req, res) => {
  try {
    console.log('[TEST] Manually generating blogs from CSV data');
    
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
    
    // Import the necessary functions
    const { processBatchQuestionsToBlogs } = await import('../Controller/openRouterService.js');
    const { createClient } = await import('@supabase/supabase-js');
    
    // Set up Supabase client
    const supabaseUrl = process.env.SUPABASE_URL || 'https://drwismqxtzpptshsqphb.supabase.co';
    const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyd2lzbXF4dHpwcHRzaHNxcGhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk3MTExNTIsImV4cCI6MjA1NTI4NzE1Mn0.V8C0Fk9u9PS_rc3Kc-X_n-KzStr--m14fKYw9b1BJSI';
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Process questions to blogs
    const results = await processBatchQuestionsToBlogs(limitedQuestions, supabase);
    
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