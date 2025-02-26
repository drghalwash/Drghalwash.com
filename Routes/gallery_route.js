
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

router.get('/:slug/:subSlug', async (req, res, next) => {
  console.log('[Route] Handling subgallery request:', req.params);
  try {
    if (!req.params.slug || !req.params.subSlug) {
      throw new Error('Invalid gallery or subgallery slug');
    }
    return await index(req, res);
  } catch (error) {
    console.error('[Route] Error handling subgallery request:', error);
    return res.status(404).render('error', {
      error: 'Gallery not found',
      movingBackground2: true,
      'site-footer': true
    });
  }
});

export default router;
