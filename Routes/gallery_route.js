
import express from 'express';
import { index } from '../Controller/gallery.js';
import { validatePassword, checkAccess } from '../Controller/galleryAccess.js';
import cookieParser from 'cookie-parser';

const router = express.Router();

// Apply cookie-parser middleware
router.use(cookieParser());

// Add body parsers for JSON and form data
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

// Password validation endpoint
router.post('/validate-password', validatePassword);

// Gallery/subgallery pages with access check
router.get('/:slug?/:subSlug?', checkAccess, index);

export default router;
