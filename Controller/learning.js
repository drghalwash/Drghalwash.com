import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://drwismqxtzpptshsqphb.supabase.co',
  process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyd2lzbXF4dHpwcHRzaHNxcGhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk3MTExNTIsImV4cCI6MjA1NTI4NzE1Mn0.V8C0Fk9u9PS_rc3Kc-X_n-KzStr--m14fKYw9b1BJSI'
);

import pdf from 'pdf-parse';

const processQAFile = async (filePath) => {
  let content;
  try {
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
  const failed = [];
  for (const qa of qaPairs) {
    try {
      const { data: existing } = await supabase
        .from('learning')
        .select('id')
        .eq('question', qa.question)
        .single();

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

const processQapartialsFolder = async () => {
  const qapartialsPath = path.join(process.cwd(), 'Qapartials');
  try {
    const files = await fs.readdir(qapartialsPath);
    for (const file of files) {
      if (file.toLowerCase().endsWith('.txt') || file.toLowerCase().endsWith('.pdf')) {
        const filePath = path.join(qapartialsPath, file);
        const qaPairs = await processQAFile(filePath);
        await insertQAPairs(qaPairs);
      }
    }
  } catch (error) {
    console.error('Error processing Qapartials folder:', error);
  }
};

const startProcessor = async () => {
  console.log('Starting learning processor...');

  const subscription = supabase
    .channel('unsorted-changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'unsorted' },
      async () => {
        console.log('Detected change in unsorted table, processing Qapartials...');
        await processQapartialsFolder();
        console.log('Finished processing Qapartials folder.');
      })
    .subscribe();


  return subscription;
};

export { startProcessor };