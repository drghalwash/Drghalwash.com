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

// Handle multipart form data
import multer from 'multer';
const upload = multer();

// Route for password validation - handle various content types
router.post('/validate-password', upload.none(), validatePassword);

// Route for gallery/subgallery pages with access check
router.get('/:slug?/:subSlug?', checkAccess, index);

export default router;