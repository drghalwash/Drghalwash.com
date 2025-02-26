
import { Router } from 'express';
import { index } from '../Controller/gallery.js';

const router = new Router();

router.get('/:slug', async (req, res) => {
  try {
    return await index(req, res);
  } catch (error) {
    console.error('[Route] Error:', error);
    return res.status(500).render('error', {
      error: 'Internal server error',
      movingBackground2: true,
      'site-footer': true
    });
  }
});

router.get('/:slug/:subSlug', async (req, res) => {
  try {
    return await index(req, res);
  } catch (error) {
    console.error('[Route] Error:', error);
    return res.status(500).render('error', {
      error: 'Internal server error',
      movingBackground2: true,
      'site-footer': true
    });
  }
});

export default router;
