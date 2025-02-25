
import { Router } from 'express';
import { index, validatePassword } from '../Controller/gallery.js';

const router = new Router();

router.get('/:slug', index);
router.post('/validate-password', validatePassword);

export default router;
