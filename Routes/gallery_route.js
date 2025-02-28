import express from 'express';
import { index } from '../Controller/gallery.js';
import { validatePassword, checkAccess } from '../Controller/galleryAccess.js';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Apply cookie-parser middleware
router.use(cookieParser());

// Add URL-encoded form data parser
router.use(express.urlencoded({ extended: true }));

// Route for password validation
router.post('/validate-password', validatePassword);

// Route for gallery/subgallery pages with access check
router.get('/:slug?/:subSlug?', checkAccess, index);

export default router;