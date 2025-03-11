// pdfparse.js
import * as fs from 'fs/promises';
import * as path from 'path';
import { getDocument } from 'pdfjs-dist/build/pdf.js';

// Set up paths - all relative to repository root
const pdfFolder = path.join(process.cwd(), 'pdf');
const parsedFolder = path.join(process.cwd(), 'parsed');
const tempFolder = path.join(process.cwd(), 'temp');

// Ensure necessary directories exist
async function ensureDirectoryExists(directory) {
  try {
    await fs.access(directory);
  } catch {
    await fs.mkdir(directory, { recursive: true });
  }
}

// Main function to process PDFs
async function processPDFs() {
  await ensureDirectoryExists(parsedFolder);
  await ensureDirectoryExists(tempFolder);
  
  // Get list of PDF files
  const files = (await fs.readdir(pdfFolder)).filter(file => file.endsWith('.pdf'));
  
  for (const file of files) {
    console.log(`Processing ${file}...`);
    await processPDF(path.join(pdfFolder, file));
  }
}

// Process a single PDF
async function processPDF(pdfPath) {
  try {
    const data = new Uint8Array(await fs.readFile(pdfPath));
    const pdf = await getDocument({ data }).promise;
    
    console.log(`PDF loaded with ${pdf.numPages} pages`);
    
    // Extract raw text content from all pages
    const rawPages = await extractRawPages(pdf);
    
    // Save raw content for debugging
    await fs.writeFile(
      path.join(tempFolder, `${path.basename(pdfPath, '.pdf')}_raw.json`),
      JSON.stringify(rawPages, null, 2)
    );
    
    // Identify chapters and their boundaries
    const chapters = identifyChapters(rawPages);
    
    // Extract questions and answers for each chapter
    const results = [];
    
    for (const chapter of chapters) {
      console.log(`Processing chapter: ${chapter.title}`);
      
      // Extract questions and choices
      const questions = extractQuestions(rawPages, chapter);
      
      // Extract explanations
      const explanations = extractExplanations(rawPages, chapter);
      
      // Match questions with explanations
      for (const question of questions) {
        const explanation = explanations.find(e => e.number === question.number);
        
        results.push({
          chapter: chapter.title,
          question: question.text,
          choices: question.choices.map(c => `${c.option}. ${c.text}`).join('\n'),
          explanation: explanation ? explanation.text : ''
        });
      }
    }
    
    // Save results
    const outputPath = path.join(parsedFolder, `${path.basename(pdfPath, '.pdf')}.json`);
    await fs.writeFile(outputPath, JSON.stringify(results, null, 2));
    
    console.log(`Successfully parsed ${results.length} questions to ${outputPath}`);
  } catch (error) {
    console.error(`Error processing ${pdfPath}:`, error);
  }
}

// Extract raw text content from all pages
async function extractRawPages(pdf) {
  const numPages = pdf.numPages;
  const pages = [];
  
  for (let i = 1; i <= numPages; i++) {
    try {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      // Process text content to reconstruct lines and paragraphs
      const { items, lines, paragraphs } = processTextContent(textContent, page);
      
      pages.push({
        pageNum: i,
        items,
        lines,
        paragraphs,
        text: lines.map(line => line.text).join('\n')
      });
    } catch (error) {
      console.error(`Error extracting page ${i}:`, error);
      pages.push({
        pageNum: i,
        error: error.message,
        text: ''
      });
    }
  }
  
  return pages;
}

// Process text content to reconstruct lines and paragraphs
function processTextContent(textContent, page) {
  const viewport = page.getViewport({ scale: 1.0 });
  const items = [];
  
  // Extract and normalize text items
  for (const item of textContent.items) {
    items.push({
      text: item.str,
      x: item.transform[4],
      y: viewport.height - item.transform[5], // Convert to top-down coordinates
      width: item.width,
      height: item.height,
      fontName: item.fontName || ''
    });
  }
  
  // Sort items by position (top to bottom, left to right)
  items.sort((a, b) => {
    const yDiff = a.y - b.y;
    if (Math.abs(yDiff) > Math.min(a.height, b.height) / 2) {
      return yDiff;
    }
    return a.x - b.x;
  });
  
  // Group items into lines
  const lines = groupItemsIntoLines(items);
  
  // Group lines into paragraphs
  const paragraphs = groupLinesIntoParagraphs(lines);
  
  return { items, lines, paragraphs };
}

// Group text items into lines based on vertical position
function groupItemsIntoLines(items) {
  if (items.length === 0) return [];
  
  const lines = [];
  let currentLine = [items[0]];
  let currentY = items[0].y;
  
  for (let i = 1; i < items.length; i++) {
    const item = items[i];
    
    // If this item is on the same line as the current one
    if (Math.abs(item.y - currentY) < item.height / 2) {
      currentLine.push(item);
    } else {
      // Start a new line
      currentLine.sort((a, b) => a.x - b.x);
      lines.push({
        y: currentY,
        items: currentLine,
        text: currentLine.map(item => item.text).join(' ')
      });
      
      currentLine = [item];
      currentY = item.y;
    }
  }
  
  // Add the final line
  if (currentLine.length > 0) {
    currentLine.sort((a, b) => a.x - b.x);
    lines.push({
      y: currentY,
      items: currentLine,
      text: currentLine.map(item => item.text).join(' ')
    });
  }
  
  return lines;
}

// Group lines into paragraphs based on spacing
function groupLinesIntoParagraphs(lines) {
  if (lines.length === 0) return [];
  
  const paragraphs = [];
  let currentParagraph = [lines[0]];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const prevLine = lines[i - 1];
    
    // Check if this is a new paragraph based on spacing
    if ((line.y - prevLine.y) > prevLine.items[0].height * 1.5) {
      paragraphs.push({
        lines: currentParagraph,
        text: currentParagraph.map(line => line.text).join('\n')
      });
      
      currentParagraph = [line];
    } else {
      currentParagraph.push(line);
    }
  }
  
  // Add the final paragraph
  if (currentParagraph.length > 0) {
    paragraphs.push({
      lines: currentParagraph,
      text: currentParagraph.map(line => line.text).join('\n')
    });
  }
  
  return paragraphs;
}

// Identify chapters and their boundaries in the PDF
function identifyChapters(pages) {
  const chapters = [];
  let currentChapter = null;
  
  // Patterns for identifying chapters, questions sections, and answers sections
  const chapterPatterns = [
    /^(Chapter|CHAPTER)\s+(\d+)[:\s]+(.+)$/i,
    /^(\d+)\s+([\w\s]+)$/
  ];
  
  const questionsSectionPatterns = [
    /^\s*Questions\s*$/i,
    /^\s*Questions\s+and\s+Answers\s*$/i
  ];
  
  const answersSectionPatterns = [
    /^\s*Answers\s*$/i,
    /^\s*(Explanations|Answer Explanations)\s*$/i
  ];
  
  // First pass: Find chapters
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    
    for (const line of page.lines) {
      for (const pattern of chapterPatterns) {
        const match = line.text.match(pattern);
        if (match) {
          // We found a new chapter
          if (currentChapter) {
            chapters.push(currentChapter);
          }
          
          currentChapter = {
            number: match[2] || match[1],
            title: `${match[2] || match[1]}. ${match[3] || match[2]}`,
            startPage: i,
            questionsStartPage: null,
            answersStartPage: null
          };
          break;
        }
      }
      
      // Check for questions section
      if (currentChapter && currentChapter.questionsStartPage === null) {
        for (const pattern of questionsSectionPatterns) {
          if (line.text.match(pattern)) {
            currentChapter.questionsStartPage = i;
            break;
          }
        }
      }
      
      // Check for answers section
      if (currentChapter && currentChapter.answersStartPage === null) {
        for (const pattern of answersSectionPatterns) {
          if (line.text.match(pattern)) {
            currentChapter.answersStartPage = i;
            break;
          }
        }
      }
    }
  }
  
  // Add the last chapter
  if (currentChapter) {
    chapters.push(currentChapter);
  }
  
  // Second pass: Finalize chapter boundaries
  for (let i = 0; i < chapters.length; i++) {
    const chapter = chapters[i];
    const nextChapter = chapters[i + 1];
    
    // If questions section not explicitly found, make a best guess
    if (chapter.questionsStartPage === null) {
      chapter.questionsStartPage = chapter.startPage;
    }
    
    // If answers section not explicitly found, look for first answer pattern
    if (chapter.answersStartPage === null) {
      for (let j = chapter.questionsStartPage; j < (nextChapter ? nextChapter.startPage : pages.length); j++) {
        const page = pages[j];
        for (const line of page.lines) {
          if (line.text.match(/^\s*\d+\.\s*[A-E]\.\s+/)) {
            chapter.answersStartPage = j;
            break;
          }
        }
        if (chapter.answersStartPage !== null) break;
      }
    }
    
    // If still not found, assume it's halfway through the chapter
    if (chapter.answersStartPage === null) {
      const endPage = nextChapter ? nextChapter.startPage - 1 : pages.length - 1;
      chapter.answersStartPage = Math.floor((chapter.startPage + endPage) / 2);
    }
    
    // Set chapter end page
    chapter.endPage = nextChapter ? nextChapter.startPage - 1 : pages.length - 1;
  }
  
  return chapters;
}

// Extract questions and their choices from a chapter
function extractQuestions(pages, chapter) {
  const questions = [];
  let currentQuestion = null;
  
  // Question and choice patterns
  const questionPattern = /^\s*(\d+)\.\s+(.+)$/;
  const choicePattern = /^\s*([A-E])\.\s+(.+)$/;
  
  // Process pages in the questions section
  for (let i = chapter.questionsStartPage; i < chapter.answersStartPage; i++) {
    const page = pages[i];
    
    for (const line of page.lines) {
      const text = line.text.trim();
      
      // Check for a new question
      const questionMatch = text.match(questionPattern);
      if (questionMatch) {
        // Save the previous question
        if (currentQuestion) {
          questions.push(currentQuestion);
        }
        
        // Start a new question
        currentQuestion = {
          number: questionMatch[1],
          text: questionMatch[2],
          choices: []
        };
        continue;
      }
      
      // Check for a choice
      if (currentQuestion) {
        const choiceMatch = text.match(choicePattern);
        if (choiceMatch) {
          currentQuestion.choices.push({
            option: choiceMatch[1],
            text: choiceMatch[2]
          });
        }
        // Handle lab values or special formatting in choices
        else if (text.match(/\b\d+(\.\d+)?\s*(mg\/dL|mmol\/L|μg\/dL|mEq\/L|mmHg)\b/) && 
                 currentQuestion.choices.length > 0) {
          // Append to the last choice as it's likely a lab value continuation
          const lastChoice = currentQuestion.choices[currentQuestion.choices.length - 1];
          lastChoice.text += ' ' + text;
        }
      }
    }
  }
  
  // Add the last question
  if (currentQuestion) {
    questions.push(currentQuestion);
  }
  
  return questions;
}

// Extract explanations for questions
function extractExplanations(pages, chapter) {
  const explanations = [];
  let currentExplanation = null;
  
  // Explanation patterns
  const explanationPatterns = [
    /^\s*(\d+)\.\s*([A-E])\.\s*(.+)$/,
    /^\s*(\d+)\.\s*The\s+answer\s+is\s+([A-E])\.\s*(.+)$/i
  ];
  
  // Process pages in the answers section
  for (let i = chapter.answersStartPage; i <= chapter.endPage; i++) {
    const page = pages[i];
    
    for (const line of page.lines) {
      const text = line.text.trim();
      
      // Check for a new explanation
      let isNewExplanation = false;
      for (const pattern of explanationPatterns) {
        const match = text.match(pattern);
        if (match) {
          // Save the previous explanation
          if (currentExplanation) {
            explanations.push(currentExplanation);
          }
          
          // Start a new explanation
          currentExplanation = {
            number: match[1],
            correctOption: match[2],
            text: match[3]
          };
          isNewExplanation = true;
          break;
        }
      }
      
      if (isNewExplanation) continue;
      
      // Continue collecting the current explanation
      if (currentExplanation) {
        // Check if this is another explanation starting
        let isAnotherExplanation = false;
        for (const pattern of explanationPatterns) {
          if (text.match(pattern)) {
            isAnotherExplanation = true;
            break;
          }
        }
        
        if (!isAnotherExplanation) {
          // This is a continuation of the current explanation
          currentExplanation.text += '\n' + text;
        }
      }
    }
  }
  
  // Add the last explanation
  if (currentExplanation) {
    explanations.push(currentExplanation);
  }
  
  return explanations;
}

// Start processing
processPDFs().catch(console.error);