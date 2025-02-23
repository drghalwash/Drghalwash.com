import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import pdf from 'pdf-parse';
import { PDFDocument } from 'pdf-lib';
import natural from 'natural';
import fse from 'fs-extra';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://drwismqxtzpptshsqphb.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyd2lzbXF4dHpwcHRzaHNxcGhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk3MTExNTIsImV4cCI6MjA1NTI4NzE1Mn0.V8C0Fk9u9PS_rc3Kc-X_n-KzStr--m14fKYw9b1BJSI';

const tokenizer = new natural.WordTokenizer();

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
    console.log('Starting enhanced PDF processing...');

    // Load PDF document for structure analysis
    const pdfDoc = await PDFDocument.load(buffer);
    const result = await pdf(buffer, {
      pagerender: async (pageData) => {
        const renderOptions = {
          normalizeWhitespace: true,
          disableCombineTextItems: false
        };
        return pageData.getTextContent(renderOptions);
      }
    });

    // Extract and clean text
    const lines = result.text.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .filter(line => line.match(/^Q[0-9]+:|^[A-E]\)/i));

    console.log(`Extracted ${lines.length} potential QA lines`);
    return lines;
  } catch (err) {
    console.error('PDF processing error:', err.message);
    return [];
  }
};

const parseQAPairs = (lines) => {
  try {
    console.log('Parsing QA pairs with enhanced validation...');
    const pairs = [];
    let currentQ = '';
    let currentChoices = [];
    let questionCount = 0;

    for (const line of lines) {
      const questionMatch = line.match(/^Q[0-9]+:\s*(.+)/i);
      const choiceMatch = line.match(/^[A-E]\)\s*(.+)/i);

      if (questionMatch) {
        if (currentQ && currentChoices.length >= 2) {
          pairs.push({
            question: currentQ.trim(),
            choices: currentChoices.map(c => c.trim()),
            metadata: {
              tokens: tokenizer.tokenize(currentQ),
              choiceCount: currentChoices.length
            }
          });
          questionCount++;
        }
        currentQ = questionMatch[1];
        currentChoices = [];
      } else if (choiceMatch && currentQ) {
        currentChoices.push(choiceMatch[0]);
      }
    }

    // Add the last pair if valid
    if (currentQ && currentChoices.length >= 2) {
      pairs.push({
        question: currentQ.trim(),
        choices: currentChoices.map(c => c.trim()),
        metadata: {
          tokens: tokenizer.tokenize(currentQ),
          choiceCount: currentChoices.length
        }
      });
      questionCount++;
    }

    console.log(`Successfully parsed ${questionCount} valid QA pairs`);
    return pairs;
  } catch (err) {
    console.error('QA parsing error:', err.message);
    return [];
  }
};

const batchInsert = async (pairs, batchSize = 25) => {
  const db = await initSupabase();
  const batches = [];

  for (let i = 0; i < pairs.length; i += batchSize) {
    batches.push(pairs.slice(i, i + batchSize));
  }

  let successCount = 0;
  let failCount = 0;

  for (const batch of batches) {
    try {
      const { data, error } = await db.from('learning').insert(
        batch.map(pair => ({
          question: pair.question,
          choices: pair.choices.join('\n'),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }))
      );

      if (error) throw error;
      successCount += batch.length;
      console.log(`Inserted batch of ${batch.length} questions successfully`);
    } catch (err) {
      failCount += batch.length;
      console.error(`Batch insert error:`, err.message);
    }
  }

  return { successCount, failCount };
};

const processFile = async (filePath) => {
  try {
    console.log(`Processing file: ${filePath}`);
    const resolvedPath = path.resolve(process.cwd(), filePath);
    
    // Create directory if it doesn't exist
    const dir = path.dirname(resolvedPath);
    await fse.ensureDir(dir);
    
    // Check if file exists
    try {
      await fse.access(resolvedPath);
    } catch (err) {
      console.log(`File ${filePath} not found, skipping...`);
      return [];
    }

    const buffer = await fse.readFile(resolvedPath);
    const ext = path.extname(resolvedPath).toLowerCase();

    if (ext === '.pdf') {
      console.log('Processing PDF file...');
      return await processPDF(buffer);
    }

    console.log('Processing text file...');
    return buffer.toString('utf-8')
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.match(/^Q[0-9]+:|^[A-E]\)/i));
  } catch (err) {
    console.error(`File processing error (${filePath}):`, err.message);
    return [];
  }
};

const startProcessor = async () => {
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
              const result = await batchInsert(allQAPairs);
              console.log(`Batch insert summary: Success - ${result.successCount}, Failure - ${result.failCount}`);
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