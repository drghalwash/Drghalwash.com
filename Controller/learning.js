
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://drwismqxtzpptshsqphb.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyd2lzbXF4dHpwcHRzaHNxcGhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk3MTExNTIsImV4cCI6MjA1NTI4NzE1Mn0.V8C0Fk9u9PS_rc3Kc-X_n-KzStr--m14fKYw9b1BJSI';
const supabase = createClient(supabaseUrl, supabaseKey);

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
