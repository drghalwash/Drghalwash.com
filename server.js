
import express from 'express';
import path from 'path';
import { engine } from 'express-handlebars';
import Handlebars from 'handlebars';
import dotenv from 'dotenv';
dotenv.config();
import methodOverride from 'method-override';
import cookieParser from 'cookie-parser'; // Added cookie-parser

import Home_route from "./Routes/Home_route.js";
import Contact_route from "./Routes/Contact_route.js";
import About_route from "./Routes/About_route.js";
import Guidelines_route from "./Routes/Guidelines_route.js";
import Choose_route from "./Routes/Choose_route.js";
import Diet_route from "./Routes/Diet_route.js";
import Drain_Care_route from "./Routes/Drain_Care_route.js";
import Finance_route from "./Routes/Finance_route.js";
import Meet_Our_Patients_route from "./Routes/Meet_Our_Patients_route.js";
import Policies_route from "./Routes/Policies_route.js";
import Questions_And_Answer_route from "./Routes/Questions_And_Answer_route.js";
import Blog_route from "./Routes/Blog_route.js";
import Read_More_route from "./Routes/Read_More_route.js";
import gallery_route from "./Routes/gallery_route.js";
import Out_of_town_route from "./Routes/Out_of_town_route.js";

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Supabase Client Initialization
import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.SUPABASE_URL || 'https://drwismqxtzpptshsqphb.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyd2lzbXF4dHpwcHRzaHNxcGhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk3MTExNTIsImV4cCI6MjA1NTI4NzE1Mn0.V8C0Fk9u9PS_rc3Kc-X_n-KzStr--m14fKYw9b1BJSI';
const supabase = createClient(supabaseUrl, supabaseKey);
console.log('[Supabase] Client initialized successfully');

// Path setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Express app
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(cookieParser()); // Initialize cookie-parser


// Handlebars Helpers
Handlebars.registerHelper("hasQuestions", function (categories) {
  if (!categories || !Array.isArray(categories)) return false;
  return categories.some(category => category && category.questions && category.questions.length > 0);
});

Handlebars.registerHelper("json", function (context) {
  return JSON.stringify(context);
});

Handlebars.registerHelper('add', function (a, b) {
  return a + b;
});

Handlebars.registerHelper('partial', function (name) {
  if (Handlebars.partials[name]) {
    return new Handlebars.SafeString(Handlebars.partials[name]);
  } else {
    console.warn(`Partial ${name} not found`);
    return '';
  }
});

// Add Handlebars helpers
Handlebars.registerHelper('modulo', function(index, val) {
    return index !== 0 && index % val === 0;
});

Handlebars.registerHelper('isFirstRow', function(index, total) {
    const rowIndex = Math.floor(index / 5);
    return rowIndex % 2 === 0;
});

Handlebars.registerHelper('eq', function(a, b) {
    return a === b;
});

// Configure Handlebars
app.engine('handlebars', engine({
  partialsDir: [
    join(__dirname, 'Qapartials'),
    join(__dirname, 'Templates', 'partials'),
  ],
  extname: '.handlebars',
  defaultLayout: 'main',
  layoutsDir: join(__dirname, 'Templates', 'layouts'),
}));
app.set('view engine', 'handlebars');
app.set('views', join(__dirname, 'Templates'));

// Serve static files
// Serve static files with proper error handling
const serveStatic = (dir) => {
  return express.static(join(__dirname, dir), {
    fallthrough: true,
    redirect: false
  });
};

app.use((err, req, res, next) => {
  console.error('Static file error:', err);
  next();
});
app.use(express.static(path.join(__dirname, 'public')));
app.use(serveStatic('Templates'));
app.use(serveStatic('Upload'));
app.use(serveStatic('Qapartials'));

// Handle 404 for static files
app.use((req, res, next) => {
  if (req.path.includes('.')) {
    console.warn(`Static file not found: ${req.path}`);
    return res.status(404).send('File not found');
  }
  next();
});

// Middleware to attach Supabase client to requests
app.use((req, res, next) => {
  req.supabase = supabase;
  next();
});

// Routes
app.use('/', Home_route);
app.use('/Home', Home_route);
app.use('/Contact', Contact_route);
app.use('/About_Us', About_route);
app.use('/Guidelines', Guidelines_route);
app.use('/Choose', Choose_route);
app.use('/Diet', Diet_route);
app.use('/Drain_Care', Drain_Care_route);
app.use('/Finance', Finance_route);
app.use('/Meet_Our_Patients', Meet_Our_Patients_route);
app.use('/Policies', Policies_route);
app.use('/your_answer_is_here', Questions_And_Answer_route);
app.use('/Blog', Blog_route);
app.use('/Read_More', Read_More_route);
app.use('/galleries', gallery_route);
app.use('/Out_of_town', Out_of_town_route);

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => { console.log(`Server is running on port ${PORT}`); });

// Error handlers
app.use((req, res) => {
  console.error('Partial not found:', req.url); // Add logging
  res.status(404).send('Page not found');
});

app.use((err, req, res, next) => {
  console.error('Error stack:', err.stack); // Add detailed logging
  res.status(500).render('error', { error: err }); // Render error page instead of plain text
});

export default async (req, res) => {
  await app(req, res);
};
