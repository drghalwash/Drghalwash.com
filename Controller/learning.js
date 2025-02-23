import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import pdf from 'pdf-parse';

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://drwismqxtzpptshsqphb.supabase.co',
  process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyd2lzbXF4dHpwcHRzaHNxcGhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk3MTExNTIsImV4cCI6MjA1NTI4NzE1Mn0.V8C0Fk9u9PS_rc3Kc-X_n-KzStr--m14fKYw9b1BJSI'
);

const processQAFile = async (filePath) => {
  console.log('Processing file:', filePath);
  try {
    if (!filePath || typeof filePath !== 'string') {
      console.warn('Invalid file path');
      return [];
    }

    const resolvedPath = path.join(process.cwd(), filePath);
    console.log('Attempting to process:', resolvedPath);

    let fileExists = false;
    try {
      await fs.access(resolvedPath);
      fileExists = true;
    } catch (err) {
      console.warn(`File not found at ${resolvedPath}`);
      return [];
    }

    if (!fileExists) {
      console.warn('File does not exist');
      return [];
    }

    const fileBuffer = await fs.readFile(resolvedPath);
    let content;

    const ext = path.extname(resolvedPath).toLowerCase();
    if (ext === '.pdf') {
      const pdfData = await pdf(fileBuffer);
      content = pdfData.text;
    } else if (ext === '.txt') {
      content = fileBuffer.toString('utf-8');
    } else {
      console.warn(`Unsupported file type: ${ext}`);
      return [];
    }

    const lines = content.split('\n')
      .map(line => line.trim())
      .filter(Boolean);

    const qaPairs = [];
    let currentQ = '';
    let currentChoices = [];

    for (const line of lines) {
      if (line.match(/^Q[0-9]+:/i)) {
        if (currentQ && currentChoices.length) {
          qaPairs.push({ question: currentQ, choices: currentChoices });
        }
        currentQ = line.replace(/^Q[0-9]+:\s*/i, '').trim();
        currentChoices = [];
      } else if (line.match(/^[A-E]\)/)) {
        currentChoices.push(line.trim());
      }
    }

    if (currentQ && currentChoices.length) {
      qaPairs.push({ question: currentQ, choices: currentChoices });
    }

    return qaPairs;
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
    return [];
  }
};

const insertQAPairs = async (qaPairs) => {
  if (!Array.isArray(qaPairs)) {
    console.error('Invalid QA pairs format');
    return;
  }

  for (const qa of qaPairs) {
    try {
      if (!qa?.question || !Array.isArray(qa?.choices)) {
        console.warn('Skipping invalid QA pair:', qa);
        continue;
      }

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

        if (error) {
          console.error('Error inserting QA pair:', error);
        }
      }
    } catch (error) {
      console.error('Error processing QA pair:', error);
    }
  }
};

const startProcessor = async () => {
  console.log('Starting learning processor...');
  try {
    const { data: dbCheck, error: dbError } = await supabase
      .from('unsorted')
      .select('count(*)')
      .single();
      
    if (dbError) {
      console.error('Database connection error:', dbError);
      return null;
    }

    const subscription = supabase
      .channel('unsorted-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'unsorted' },
        async (payload) => {
          console.log('Change detected:', payload);
          try {
            const { data: latestRow, error } = await supabase
              .from('unsorted')
              .select('qc')
              .order('id', { ascending: false })
              .limit(1)
              .single();

            if (error) throw error;
            if (!latestRow) {
              console.log('No rows in unsorted table');
              return;
            }

            const questionLimit = parseInt(latestRow.qc);
            if (isNaN(questionLimit)) {
              console.error('Invalid question limit:', latestRow.qc);
              return;
            }

            console.log(`Processing ${questionLimit} questions`);
            const rootDir = process.cwd();
            const files = await fs.readdir(rootDir);
            let processedCount = 0;

            for (const file of files) {
              if (processedCount >= questionLimit) break;

              const ext = path.extname(file).toLowerCase();
              if (ext === '.txt' || ext === '.pdf') {
                const filePath = path.join(rootDir, file);
                console.log(`Processing ${filePath}`);
                const qaPairs = await processQAFile(filePath);
                await insertQAPairs(qaPairs.slice(0, questionLimit - processedCount));
                processedCount += qaPairs.length;
              }
            }
            console.log(`Processed ${processedCount} QA pairs`);
          } catch (error) {
            console.error('Error in change handler:', error);
          }
        })
      .subscribe();

    return subscription;
  } catch (error) {
    console.error('Failed to start processor:', error);
    throw error;
  }
};

const addLearning = async (req, res) => {
  try {
    const { question, choices } = req.body;
    if (!question || !Array.isArray(choices)) {
      return res.status(400).json({ error: 'Invalid input' });
    }

    const { data, error } = await supabase
      .from('learning')
      .insert([{ 
        question,
        choices: choices.join('\n'),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]);

    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    console.error('Error adding learning:', error);
    res.status(500).json({ error: error.message });
  }
};

export { startProcessor, addLearning };