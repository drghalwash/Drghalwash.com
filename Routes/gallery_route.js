
import { Router } from 'express';
import { index } from '../Controller/gallery.js';
import { validatePassword, checkAccess } from '../Controller/galleryAccess.js';

const router = new Router();

router.get('/', index);
router.get('/:slug', index);
router.get('/:slug/:subSlug', checkAccess, index);
router.post('/validate-password', validatePassword);

export default router;
