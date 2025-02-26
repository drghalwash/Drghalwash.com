
import { Router } from 'express';
import { index } from '../Controller/gallery.js';

const router = new Router();

router.get('/:slug', async (req, res) => {
  return await index(req, res);
});

router.get('/:slug/:subSlug', async (req, res) => {
  return await index(req, res);
});

export default router;
