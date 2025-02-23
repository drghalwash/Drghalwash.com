
import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import pdf from 'pdf-parse';

// Fallback values if env vars not set
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://drwismqxtzpptshsqphb.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyd2lzbXF4dHpwcHRzaHNxcGhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk3MTExNTIsImV4cCI6MjA1NTI4NzE1Mn0.V8C0Fk9u9PS_rc3Kc-X_n-KzStr--m14fKYw9b1BJSI';

let supabase;
try {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
} catch (err) {
  console.error('Failed to initialize Supabase client:', err);
  supabase = null;
}

const retryOperation = async (operation, maxRetries = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (err) {
      if (attempt === maxRetries) throw err;
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
};

const ensureSupabaseConnection = async () => {
  if (!supabase) {
    try {
      supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
      const { data, error } = await supabase.from('learning').select('count');
      if (error) throw error;
    } catch (err) {
      console.error('Failed to reconnect to Supabase:', err);
      throw new Error('Database connection failed');
    }
  }
  return supabase;
};

const processQAFile = async (filePath) => {
  if (!filePath?.trim()) {
    console.warn('Invalid or empty file path provided');
    return [];
  }

  try {
    const resolvedPath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
    console.log('Processing file:', resolvedPath);

    // Check file existence
    try {
      await fs.access(resolvedPath);
    } catch (err) {
      console.warn(`File not accessible: ${resolvedPath}`);
      return [];
    }

    // Create directory if needed
    const dir = path.dirname(resolvedPath);
    await fs.mkdir(dir, { recursive: true }).catch(err => {
      console.warn(`Directory creation failed: ${err.message}`);
    });

    // Read and process file
    const fileBuffer = await fs.readFile(resolvedPath);
    const ext = path.extname(resolvedPath).toLowerCase();
    let content = '';

    if (ext === '.pdf') {
      const pdfData = await pdf(fileBuffer).catch(err => {
        console.error('PDF parsing failed:', err);
        return { text: '' };
      });
      content = pdfData.text;
    } else if (ext === '.txt') {
      content = fileBuffer.toString('utf-8');
    } else {
      console.warn(`Unsupported file type: ${ext}`);
      return [];
    }

    const qaPairs = [];
    const lines = content.split('\n').map(line => line.trim()).filter(Boolean);
    let currentQ = '';
    let currentChoices = [];

    for (const line of lines) {
      if (line.match(/^Q[0-9]+:/i)) {
        if (currentQ && currentChoices.length) {
          qaPairs.push({ question: currentQ, choices: [...currentChoices] });
        }
        currentQ = line.replace(/^Q[0-9]+:\s*/i, '').trim();
        currentChoices = [];
      } else if (line.match(/^[A-E]\)/)) {
        currentChoices.push(line.trim());
      }
    }

    if (currentQ && currentChoices.length) {
      qaPairs.push({ question: currentQ, choices: [...currentChoices] });
    }

    return qaPairs;
  } catch (error) {
    console.error(`File processing error: ${error.message}`);
    return [];
  }
};

const insertQAPairs = async (qaPairs) => {
  if (!Array.isArray(qaPairs) || !qaPairs.length) {
    console.warn('No valid QA pairs to insert');
    return;
  }

  await ensureSupabaseConnection();

  for (const qa of qaPairs) {
    if (!qa?.question?.trim() || !Array.isArray(qa?.choices)) {
      console.warn('Skipping invalid QA pair:', qa);
      continue;
    }

    await retryOperation(async () => {
      const { data: existing } = await supabase
        .from('learning')
        .select('id')
        .eq('question', qa.question)
        .maybeSingle();

      if (!existing) {
        const { error } = await supabase
          .from('learning')
          .insert({
            question: qa.question,
            choices: qa.choices.join('\n'),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (error) throw error;
      }
    });
  }
};

const startProcessor = async () => {
  console.log('Starting learning processor...');
  
  try {
    await ensureSupabaseConnection();
    
    const subscription = supabase
      .channel('unsorted-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'unsorted' },
        async (payload) => {
          try {
            const { data: latestRow } = await supabase
              .from('unsorted')
              .select('qc')
              .order('id', { ascending: false })
              .limit(1)
              .single();

            if (!latestRow?.qc) {
              console.warn('No valid question count found');
              return;
            }

            const questionLimit = parseInt(latestRow.qc);
            if (isNaN(questionLimit) || questionLimit <= 0) {
              console.warn('Invalid question limit:', latestRow.qc);
              return;
            }

            const rootDir = process.cwd();
            const files = await fs.readdir(rootDir).catch(() => []);
            let processedCount = 0;

            for (const file of files) {
              if (processedCount >= questionLimit) break;

              const ext = path.extname(file).toLowerCase();
              if (ext === '.txt' || ext === '.pdf') {
                const qaPairs = await processQAFile(path.join(rootDir, file));
                await insertQAPairs(qaPairs.slice(0, questionLimit - processedCount));
                processedCount += qaPairs.length;
              }
            }
          } catch (error) {
            console.error('Change handler error:', error);
          }
        })
      .subscribe();

    return subscription;
  } catch (error) {
    console.error('Processor startup failed:', error);
    return null;
  }
};

const addLearning = async (req, res) => {
  try {
    const { question, choices } = req.body || {};
    
    if (!question?.trim() || !Array.isArray(choices) || !choices.length) {
      return res.status(400).json({ error: 'Invalid input format' });
    }

    await ensureSupabaseConnection();
    
    const { data, error } = await supabase
      .from('learning')
      .insert([{
        question: question.trim(),
        choices: choices.join('\n'),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]);

    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    console.error('Add learning error:', error);
    res.status(500).json({ error: error.message });
  }
};

export { startProcessor, addLearning };
