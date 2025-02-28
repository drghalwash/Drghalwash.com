import express from 'express';
import { index } from '../Controller/gallery.js';
import { checkAccess, validatePassword } from '../Controller/galleryAccess.js';

const router = express.Router();

router.get('/galleries/:slug', index);
router.get('/galleries/:slug/:subSlug', checkAccess, index);
router.post('/galleries/validate-password', validatePassword);

export default router;