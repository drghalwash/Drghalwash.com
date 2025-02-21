import { Router } from 'express';
import { index } from '../Controller/Meet_our_paitent.js';
const router = new Router();
router.get('/', index);
export default router;