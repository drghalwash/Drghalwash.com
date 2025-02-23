import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import pdf from 'pdf-parse';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://drwismqxtzpptshsqphb.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyd2lzbXF4dHpwcHRzaHNxcGhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk3MTExNTIsImV4cCI6MjA1NTI4NzE1Mn0.V8C0Fk9u9PS_rc3Kc-X_n-KzStr--m14fKYw9b1BJSI';

let supabase = null;

const initSupabase = async () => {
  try {
    if (!supabase) {
      supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
      await supabase.from('learning').select('count');
    }
    return supabase;
  } catch (err) {
    console.error('Supabase initialization failed:', err);
    throw new Error('Database connection failed');
  }
};

const retryOperation = async (operation, maxRetries = 5, delay = 1000) => {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
        console.log(`Retry attempt ${attempt} of ${maxRetries}`);
      }
    }
  }
  throw lastError;
};

const processPDF = async (buffer) => {
  try {
    const result = await pdf(buffer);
    return result.text;
  } catch (err) {
    console.error('PDF processing error:', err);
    return '';
  }
};

const processFile = async (filePath) => {
  try {
    const resolvedPath = path.resolve(process.cwd(), filePath);
    const buffer = await fs.readFile(resolvedPath);
    const ext = path.extname(resolvedPath).toLowerCase();

    const content = ext === '.pdf' ? 
      await processPDF(buffer) : 
      buffer.toString('utf-8');

    return content.split('\n')
      .map(line => line.trim())
      .filter(Boolean);
  } catch (err) {
    console.error(`File processing error (${filePath}):`, err);
    return [];
  }
};

const parseQAPairs = (lines) => {
  const pairs = [];
  let currentQ = '';
  let currentChoices = [];

  for (const line of lines) {
    if (line.match(/^Q[0-9]+:/i)) {
      if (currentQ && currentChoices.length) {
        pairs.push({ question: currentQ, choices: [...currentChoices] });
      }
      currentQ = line.replace(/^Q[0-9]+:\s*/i, '').trim();
      currentChoices = [];
    } else if (line.match(/^[A-E]\)/)) {
      currentChoices.push(line.trim());
    }
  }

  if (currentQ && currentChoices.length) {
    pairs.push({ question: currentQ, choices: [...currentChoices] });
  }

  return pairs;
};

const batchInsert = async (pairs, batchSize = 50) => {
  const db = await initSupabase();
  const batches = [];

  for (let i = 0; i < pairs.length; i += batchSize) {
    batches.push(pairs.slice(i, i + batchSize));
  }

  await Promise.all(batches.map(async (batch) => {
    await retryOperation(async () => {
      const { error } = await db.from('learning').insert(
        batch.map(pair => ({
          question: pair.question,
          choices: pair.choices.join('\n'),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }))
      );
      if (error) throw error;
    });
  }));
};

const startProcessor = async () => {
  console.log('Starting learning processor with enhanced error handling...');

  try {
    const db = await initSupabase();

    return db.channel('unsorted-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'unsorted' },
        async (payload) => {
          try {
            const { data: latestRow } = await db
              .from('unsorted')
              .select('qc')
              .order('id', { ascending: false })
              .limit(1)
              .single();

            if (!latestRow?.qc) return;

            const questionLimit = parseInt(latestRow.qc);
            if (isNaN(questionLimit) || questionLimit <= 0) return;

            const rootDir = process.cwd();
            const files = await fs.readdir(rootDir);

            const supportedFiles = files.filter(f => 
              ['.txt', '.pdf'].includes(path.extname(f).toLowerCase())
            );

            const processedFiles = await Promise.all(
              supportedFiles.map(processFile)
            );

            const allQAPairs = processedFiles
              .flatMap(lines => parseQAPairs(lines))
              .slice(0, questionLimit);

            if (allQAPairs.length > 0) {
              await batchInsert(allQAPairs);
            }
          } catch (err) {
            console.error('Change handler error:', err);
          }
        })
      .subscribe();
  } catch (err) {
    console.error('Processor startup failed:', err);
    return null;
  }
};

const addLearning = async (req, res) => {
  try {
    const { question, choices } = req.body || {};

    if (!question?.trim() || !Array.isArray(choices) || !choices.length) {
      return res.status(400).json({ error: 'Invalid input format' });
    }

    const db = await initSupabase();

    await retryOperation(async () => {
      const { error } = await db
        .from('learning')
        .insert([{
          question: question.trim(),
          choices: choices.join('\n'),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      if (error) throw error;
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Add learning error:', err);
    res.status(500).json({ error: err.message });
  }
};

export { startProcessor, addLearning };