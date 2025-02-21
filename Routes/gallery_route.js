// gallery_route.js
import { Router } from 'express';
import { index } from '../Controller/gallery.js';

const router = new Router();

// Route: Fetch gallery by slug (e.g., .com/galleries/Face)
router.get('/:slug', index);

export default router;
