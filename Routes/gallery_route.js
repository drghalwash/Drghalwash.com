
import { Router } from 'express';
import { index } from '../Controller/gallery.js';

const router = new Router();

router.get('/:slug', (req, res, next) => {
  console.log('[Route] Handling gallery request:', req.params);
  try {
    return index(req, res);
  } catch (error) {
    console.error('[Route] Error handling gallery request:', error);
    next(error);
  }
});

router.get('/:slug/:subSlug', (req, res, next) => {
  console.log('[Route] Handling subgallery request:', req.params);
  try {
    return index(req, res);
  } catch (error) {
    console.error('[Route] Error handling subgallery request:', error);
    next(error);
  }
});

export default router;
