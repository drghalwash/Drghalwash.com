import { Router } from 'express';
import { index,Save } from '../Controller/Contact.js';
const router = new Router();
router.get('/', index);
router.post('/Save', Save);
export default router;