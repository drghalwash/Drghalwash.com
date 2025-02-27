
import { Router } from 'express';
import { index } from '../Controller/gallery.js';
import { validatePassword, isAuthorized } from '../Controller/galleryAccess.js';

const router = new Router();

router.get('/', index);
router.get('/:slug', index);
router.get('/:slug/:subSlug', isAuthorized, index);
router.post('/validate-password', validatePassword);

export default router;
