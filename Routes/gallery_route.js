import express from 'express';
import { index } from '../Controller/gallery.js';
import { validatePassword, checkAccess } from '../Controller/galleryAccess.js';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Apply cookie-parser middleware
router.use(cookieParser());

// Add body parsers for different content types
router.use(express.urlencoded({ extended: true }));
router.use(express.json());

// Enable CORS for API requests
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    return res.status(200).json({});
  }
  next();
});

// Route for password validation
router.post('/validate-password', validatePassword);

// Route for gallery/subgallery pages with access check
router.get('/:slug?/:subSlug?', checkAccess, index);

export default router;