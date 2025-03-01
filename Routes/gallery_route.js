
import express from 'express';
import { index, validatePassword } from '../Controller/gallery.js';
import cookieParser from 'cookie-parser';

const router = express.Router();

// Apply cookie-parser middleware
router.use(cookieParser());

// Route for password validation
router.post('/validate-password', validatePassword);

// Route for gallery/subgallery pages
router.get('/:slug?/:subSlug?', index);

export default router;
