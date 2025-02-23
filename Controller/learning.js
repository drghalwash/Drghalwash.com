import { createClient } from '@supabase/supabase-js';
import { new Date } from 'date-fns'

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://drwismqxtzpptshsqphb.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyd2lzbXF4dHpwcHRzaHNxcGhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk3MTExNTIsImV4cCI6MjA1NTI4NzE1Mn0.V8C0Fk9u9PS_rc3Kc-X_n-KzStr--m14fKYw9b1BJSI';

const initSupabase = async () => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    await supabase.from('learning').select('count');
    return supabase;
  } catch (err) {
    console.error('Database connection error:', err);
    throw new Error('Failed to initialize database');
  }
};

const addLearning = async (req, res) => {
  try {
    const { question, choices } = req.body || {};

    if (!question?.trim() || !Array.isArray(choices) || !choices.length) {
      return res.status(400).json({ error: 'Invalid input format' });
    }

    const db = await initSupabase();
    const { error } = await db
      .from('learning')
      .insert([{
        question: question.trim(),
        choices: choices.join('\n'),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]);

    if (error) throw error;
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Add learning error:', err);
    res.status(500).json({ error: err.message });
  }
};

export { addLearning };