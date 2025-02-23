import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://drwismqxtzpptshsqphb.supabase.co',
  process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyd2lzbXF4dHpwcHRzaHNxcGhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk3MTExNTIsImV4cCI6MjA1NTI4NzE1Mn0.V8C0Fk9u9PS_rc3Kc-X_n-KzStr--m14fKYw9b1BJSI'
);

import pdf from 'pdf-parse';

const processQAFile = async (filePath) => {
  if (!filePath || typeof filePath !== 'string') {
    console.error('Invalid file path:', filePath);
    return [];
  }

  let content;
  try {
    const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
    if (!fileExists) {
      console.error('File does not exist:', filePath);
      return [];
    }

    if (filePath.toLowerCase().endsWith('.pdf')) {
      const dataBuffer = await fs.readFile(filePath);
      const pdfData = await pdf(dataBuffer);
      content = pdfData.text;
    } else {
      content = await fs.readFile(filePath, 'utf-8');
    }
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return []; // Return empty array if file processing fails
  }
  const lines = content.split('\n').map(line => line.trim()).filter(Boolean);
  const qaPairs = [];

  let currentQ = '';
  let currentChoices = [];

  for (const line of lines) {
    if (line.match(/^Q[0-9]+:/i)) {
      if (currentQ && currentChoices.length) {
        qaPairs.push({ question: currentQ, choices: currentChoices });
      }
      currentQ = line.replace(/^Q[0-9]+:\s*/i, '');
      currentChoices = [];
    } else if (line.match(/^[A-E]\)/)) {
      currentChoices.push(line);
    }
  }

  if (currentQ && currentChoices.length) {
    qaPairs.push({ question: currentQ, choices: currentChoices });
  }

  return qaPairs;
};

const insertQAPairs = async (qaPairs) => {
  if (!Array.isArray(qaPairs)) {
    console.error('Invalid QA pairs format:', qaPairs);
    return;
  }

  const failed = [];
  for (const qa of qaPairs) {
    if (!qa?.question || !Array.isArray(qa?.choices)) {
      console.error('Invalid QA pair structure:', qa);
      continue;
    }

    try {
      const { data: existing } = await supabase
        .from('learning')
        .select('id')
        .eq('question', qa.question)
        .maybeSingle();

      if (!existing) {
        await supabase
          .from('learning')
          .insert({
            question: qa.question,
            choices: qa.choices.join('\n'),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      }
    } catch (error) {
      console.error(`Error inserting QA pair: ${qa.question}`, error);
      failed.push(qa);
    }
  }
  if (failed.length > 0) {
    console.warn(`Failed to insert ${failed.length} QA pairs.`);
  }
};

const processRootFolder = async () => {
  const rootPath = process.cwd();
  try {
    const files = await fs.readdir(rootPath);
    for (const file of files) {
      if (file.toLowerCase().endsWith('.txt') || file.toLowerCase().endsWith('.pdf')) {
        const filePath = path.join(rootPath, file);
        const qaPairs = await processQAFile(filePath);
        await insertQAPairs(qaPairs);
      }
    }
  } catch (error) {
    console.error('Error processing root folder:', error);
  }
};

const startProcessor = async () => {
  console.log('Starting learning processor...');

  const subscription = supabase
    .channel('unsorted-changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'unsorted' },
      async (payload) => {
        console.log('Detected change in unsorted table:', payload);
        try {
          // Get the latest row
          const { data: latestRow, error } = await supabase
            .from('unsorted')
            .select('qc')
            .order('id', { ascending: false })
            .limit(1)
            .single();

          if (error) {
            console.error('Error fetching latest unsorted row:', error);
            return;
          }

          console.log('Processing latest unsorted row:', latestRow);
          const questionLimit = parseInt(latestRow.qc);

          if (isNaN(questionLimit)) {
            console.error('Invalid question limit value:', latestRow.qc);
            return;
          }

          console.log(`Will process ${questionLimit} questions from root directory`);
          let processedCount = 0;

          const rootPath = process.cwd();
          const files = await fs.readdir(rootPath);

          for (const file of files) {
            if (processedCount >= questionLimit) {
              console.log(`Reached question limit of ${questionLimit}`);
              break;
            }

            if (file.toLowerCase().endsWith('.txt') || file.toLowerCase().endsWith('.pdf')) {
              console.log(`Processing file: ${file}`);
              const filePath = path.join(rootPath, file);
              const qaPairs = await processQAFile(filePath);

              // Only process up to the remaining limit
              const pairsToProcess = qaPairs.slice(0, questionLimit - processedCount);
              console.log(`Processing ${pairsToProcess.length} pairs from ${file}`);

              await insertQAPairs(pairsToProcess);
              processedCount += pairsToProcess.length;
            }
          }

          console.log(`Successfully processed ${processedCount} QA pairs`);
        } catch (err) {
          console.error('Error in QA processing:', err);
        }
    })
    .subscribe();

  return subscription;
};

const addLearning = async (req, res) => {
  try {
    const { question, choices } = req.body;
    
    const { data, error } = await supabase
      .from('learning')
      .insert([
        { 
          question,
          choices: choices.join('\n'),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]);

    if (error) throw error;
    res.status(200).json(data);
  } catch (err) {
    console.error('Error adding learning:', err);
    res.status(500).json({ error: err.message });
  }
};

export { startProcessor, addLearning };