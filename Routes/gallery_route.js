import express from 'express';
import { index } from '../Controller/gallery.js';
import { validatePassword, checkAccess } from '../Controller/galleryAccess.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Add body parsers for different content types
router.use(express.urlencoded({ extended: true }));
router.use(express.json());

// Route for password validation
router.post('/validate-password', validatePassword);

// Route for gallery/subgallery pages with access check
router.get('/:slug?/:subSlug?', checkAccess, index);

export default router;