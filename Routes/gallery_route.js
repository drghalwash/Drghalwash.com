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

// API route for password validation - using body parser middleware to parse JSON
router.post('/api/gallery/validate-password', express.json(), validatePassword);


// Route for gallery/subgallery pages with access check, using JWT for authentication.
router.get('/:slug?/:subSlug?', (req, res, next) => {
  const token = req.cookies.jwt; // Get JWT from cookies

  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
      if (err) {
        // Handle token verification errors (e.g., expired token)
        return res.status(401).json({ message: 'Unauthorized' });
      }
      req.user = decodedToken; // Add user information to the request object
      next(); // Proceed to the next middleware (checkAccess and index)
    });
  } else {
      return res.status(401).json({ message: 'Unauthorized' });
  }
}, checkAccess, index);

export default router;