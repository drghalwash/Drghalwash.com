
import { Router } from 'express';
import { index } from '../Controller/gallery.js';

const router = new Router();

router.get('/', index);
router.get('/:slug', index);
router.get('/:slug/:subSlug', index);

export default router;
