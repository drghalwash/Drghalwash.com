
import express from 'express';
import * as galleryAccess from '../Controller/galleryAccess.js';
import * as galleryController from '../Controller/gallery.js';

const router = express.Router();

// Get gallery by slug
router.get('/:slug', galleryController.showGallery);

// API routes for password validation and token validation
router.post('/access/:slug', galleryAccess.validatePassword);
router.post('/validate/:slug', galleryAccess.validateToken);

export default router;
