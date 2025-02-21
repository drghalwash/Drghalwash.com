
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://drwismqxtzpptshsqphb.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyd2lzbXF4dHpwcHRzaHNxcGhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk3MTExNTIsImV4cCI6MjA1NTI4NzE1Mn0.V8C0Fk9u9PS_rc3Kc-X_n-KzStr--m14fKYw9b1BJSI';
const supabase = createClient(supabaseUrl, supabaseKey);

// Create learning table
const createTable = async () => {
  console.log('Creating learning table...');
  const { error } = await supabase
    .from('learning')
    .insert([
      { 
        q: 'test question',
        a: 'test answer',
        d: new Date().toISOString().split('T')[0]
      }
    ])
    .select();

  if (error) {
    console.error('Error with learning table:', error);
  } else {
    console.log('Learning table is ready');
  }
};

// Initialize table
createTable().catch(console.error);

// Create learning table if it doesn't exist
const createLearningTable = async () => {
  const { error } = await supabase.rpc('create_learning_table', {
    sql: `
      CREATE TABLE IF NOT EXISTS learning (
        id SERIAL PRIMARY KEY,
        q TEXT NOT NULL,
        a TEXT NOT NULL,
        d DATE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `
  });
  
  if (error) {
    console.error('Error creating learning table:', error);
    throw error;
  }
};

// Initialize table
createLearningTable().catch(console.error);

export const addLearning = async (req, res) => {
  try {
    const { q, a, d } = req.body;
    
    const { data, error } = await supabase
      .from('learning')
      .insert([{ q, a, d }]);

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Learning entry error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
