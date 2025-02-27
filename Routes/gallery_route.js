
import { Router } from 'express';
import { index } from '../Controller/gallery.js';

const router = new Router();

router.get('/', index);
router.get('/:slug', index);
router.get('/:slug/:subSlug', index);

export default router;
import { Router } from 'express';
import { index } from '../Controller/gallery.js';
import { validatePassword, checkSubgalleryAccess } from '../Controller/galleryAccess.js';

const router = new Router();

router.get('/', index);
router.get('/:slug', index);
router.get('/:slug/:subSlug', checkSubgalleryAccess, index);
router.post('/validate-password', validatePassword);

export default router;
